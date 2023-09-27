import { Injectable } from '@nestjs/common'
import { EnumOrderStatus } from '@prisma/client'
import crypto from 'crypto'
import { PrismaService } from 'src/prisma.service'
import { productReturnObject } from 'src/product/return-product.object'
import Stripe from 'stripe'
import { OrderDto } from './order.dto'
require('dotenv').config()

const stripe = require('stripe')(process.env['SECRET_KEY'])

const keyBuffer = process.env['ENCRYPTION_KEY']
	? Buffer.from(process.env['ENCRYPTION_KEY'], 'hex')
	: crypto.randomBytes(32)
const ENCRYPTION_KEY = keyBuffer
const IV_LENGTH = 16

function encrypt(text) {
	let iv = crypto.randomBytes(IV_LENGTH)
	let cipher = crypto.createCipheriv(
		'aes-256-cbc',
		Buffer.from(ENCRYPTION_KEY),
		iv
	)
	let encrypted = cipher.update(text)
	encrypted = Buffer.concat([encrypted, cipher.final()])
	return iv.toString('hex') + ':' + encrypted.toString('hex')
}

function decrypt(text) {
	try {
		let textParts = text.split(':')
		let iv = Buffer.from(textParts.shift(), 'hex')
		let encryptedText = Buffer.from(textParts.join(':'), 'hex')
		let decipher = crypto.createDecipheriv(
			'aes-256-cbc',
			Buffer.from(ENCRYPTION_KEY),
			iv
		)
		let decrypted = decipher.update(encryptedText)
		decrypted = Buffer.concat([decrypted, decipher.final()])
		return decrypted.toString()
	} catch (error) {
		console.error(`Error decrypting data: ${error.message}`)
		return text
	}
}
@Injectable()
export class OrderService {
	private readonly stripe = new Stripe(process.env['SECRET_KEY'] || '', {
		apiVersion: '2023-08-16'
	})
	constructor(private prisma: PrismaService) {}

	async getAll() {
		const orders = await this.prisma.order.findMany({
			include: {
				items: {
					include: {
						product: {
							select: productReturnObject
						}
					}
				}
			}
		})

		orders.forEach(order => {
			order.firstName = decrypt(order.firstName)
			order.lastName = decrypt(order.lastName)
			order.country = decrypt(order.country)
			order.state = decrypt(order.state)
			order.city = decrypt(order.city)
			order.postCode = decrypt(order.postCode)
			order.street = decrypt(order.street)
			order.house = decrypt(order.house)
			order.phoneCode = decrypt(order.phoneCode)
			order.phone = decrypt(order.phone)
			order.email = decrypt(order.email)
		})
		return orders
	}
	async getByUserId(userId: number) {
		const orders = await this.prisma.order.findMany({
			where: { userId },
			orderBy: {
				createdAt: 'desc'
			},
			include: {
				items: {
					include: {
						product: {
							select: productReturnObject
						}
					}
				}
			}
		})

		orders.forEach(order => {
			order.firstName = decrypt(order.firstName)
			order.lastName = decrypt(order.lastName)
			order.country = decrypt(order.country)
			order.state = decrypt(order.state)
			order.city = decrypt(order.city)
			order.postCode = decrypt(order.postCode)
			order.street = decrypt(order.street)
			order.house = decrypt(order.house)
			order.phoneCode = decrypt(order.phoneCode)
			order.phone = decrypt(order.phone)
			order.email = decrypt(order.email)
		})
		return orders
	}

	async createPaymentIntent(
		amount: number,
		currency: string,
		orderId?: number
	) {
		try {
			const paymentIntent = await stripe.paymentIntents.create({
				amount: Math.round(amount * 100),
				currency,
				metadata: orderId ? { orderId: orderId.toString() } : undefined
			})

			return paymentIntent
		} catch (error) {
			console.error('Error creating Stripe PaymentIntent', error)
		}
	}
	async placeOrder(dto: OrderDto, userId?: number) {
		const total = dto.items.reduce((acc, item) => {
			return acc + item.price * item.quantity
		}, 0)

		const orderData = {
			status: dto.status,
			total: total,
			paymentIntentId: '',
			paymentUrl: '',
			items: {
				create: dto.items
			},
			firstName: encrypt(dto.firstName),
			lastName: encrypt(dto.lastName),
			country: encrypt(dto.country),
			state: encrypt(dto.state),
			city: encrypt(dto.city),
			postCode: encrypt(dto.postCode),
			street: encrypt(dto.street),
			house: encrypt(dto.house),
			phoneCode: encrypt(dto.phoneCode),
			phone: encrypt(dto.phone),
			email: encrypt(dto.email)
		}

		if (userId) {
			orderData['user'] = {
				connect: {
					id: userId
				}
			}
		}

		const order = await this.prisma.order.create({
			data: orderData
		})

		const products = await this.prisma.product.findMany({
			where: {
				id: {
					in: dto.items.map(item => item.productId)
				}
			}
		})

		// Создаем line_items для Stripe Checkout Session
		let line_items = dto.items.map(item => {
			const product = products.find(p => p.id === item.productId)

			return {
				price_data: {
					currency: 'usd',
					product_data: {
						name: `${product.name}`,
						images: product.images ? [product.images[0]] : []
					},
					unit_amount: Math.round(item.price * 100)
				},
				quantity: item.quantity
			}
		})

		// Создаем Stripe Checkout Session
		const session = await this.stripe.checkout.sessions.create({
			payment_method_types: ['card'],
			line_items: line_items,
			mode: 'payment',
			customer_email: dto.email,
			success_url: 'http://localhost:3000/thanks',
			// 'https://example.com/success?session_id={CHECKOUT_SESSION_ID}',
			cancel_url: 'http://localhost:3000/wrong',
			metadata: {
				orderId: order.id.toString()
			}
		})
		await this.prisma.order.update({
			where: { id: order.id },
			data: { paymentUrl: session.url }
		})
		return session
	}
	async handleStripeWebhook(event: Stripe.Event) {
		switch (event.type) {
			case 'checkout.session.completed':
				const session = event.data.object as Stripe.Checkout.Session
				const orderId = session.metadata.orderId
				const paymentIntentId = session.payment_intent as string
				const customerEmail = session.customer_email as string
				if (orderId && paymentIntentId) {
					await this.prisma.order.update({
						where: { id: parseInt(orderId, 10) },
						data: {
							status: EnumOrderStatus.PAYED,
							paymentIntentId: paymentIntentId,
							email: customerEmail
						}
					})
					return { statusCode: 200, message: 'Webhook handled successfully' }
				} else {
					console.error(
						'Не удалось найти идентификатор заказа и айди платежа в сессии.'
					)
				}
				break
			default:
				console.log(`Unhandled event type: ${event.type}`)
		}
	}
}
