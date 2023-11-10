import { Injectable } from '@nestjs/common'
import { EnumOrderStatus } from '@prisma/client'
import * as nodemailer from 'nodemailer'
import { PrismaService } from 'src/prisma.service'
import { productReturnObject } from 'src/product/return-product.object'
import { EncryptionUtility } from 'src/utils/crypto.utility'
import Stripe from 'stripe'

import { OrderDto } from './order.dto'
require('dotenv').config()

const stripe = require('stripe')(process.env['SECRET_KEY'])

const salesTax = 0 // sales tax per send

@Injectable()
export class OrderService {
	private transporter
	private readonly stripe = new Stripe(process.env['SECRET_KEY'] || '', {
		apiVersion: '2023-08-16'
	})
	constructor(private prisma: PrismaService) {
		this.transporter = nodemailer.createTransport({
			service: 'hotmail',
			auth: {
				user: process.env.EMAIL_USERNAME,
				pass: process.env.EMAIL_PASSWORD
			}
		})
	}

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
			order.firstName = EncryptionUtility.decrypt(order.firstName)
			order.lastName = EncryptionUtility.decrypt(order.lastName)
			order.country = EncryptionUtility.decrypt(order.country)
			order.state = EncryptionUtility.decrypt(order.state)
			order.city = EncryptionUtility.decrypt(order.city)
			order.postCode = EncryptionUtility.decrypt(order.postCode)
			order.street = EncryptionUtility.decrypt(order.street)
			order.house = EncryptionUtility.decrypt(order.house)
			order.phoneCode = EncryptionUtility.decrypt(order.phoneCode)
			order.phone = EncryptionUtility.decrypt(order.phone)
			order.email = order.email
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
			order.firstName = EncryptionUtility.decrypt(order.firstName)
			order.lastName = EncryptionUtility.decrypt(order.lastName)
			order.country = EncryptionUtility.decrypt(order.country)
			order.state = EncryptionUtility.decrypt(order.state)
			order.city = EncryptionUtility.decrypt(order.city)
			order.postCode = EncryptionUtility.decrypt(order.postCode)
			order.street = EncryptionUtility.decrypt(order.street)
			order.house = EncryptionUtility.decrypt(order.house)
			order.phoneCode = EncryptionUtility.decrypt(order.phoneCode)
			order.phone = EncryptionUtility.decrypt(order.phone)
			order.email = order.email
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
			total: total + salesTax,
			paymentIntentId: '',
			paymentUrl: '',
			items: {
				create: dto.items
			},
			firstName: EncryptionUtility.encrypt(dto.firstName),
			lastName: EncryptionUtility.encrypt(dto.lastName),
			country: EncryptionUtility.encrypt(dto.country),
			state: EncryptionUtility.encrypt(dto.state),
			city: EncryptionUtility.encrypt(dto.city),
			postCode: EncryptionUtility.encrypt(dto.postCode),
			street: EncryptionUtility.encrypt(dto.street),
			house: EncryptionUtility.encrypt(dto.house),
			phoneCode: EncryptionUtility.encrypt(dto.phoneCode),
			phone: EncryptionUtility.encrypt(dto.phone),
			email: dto.email
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
					unit_amount: Math.round((item.price + salesTax) * 100)
				},
				quantity: item.quantity
			}
		})
		const session = await this.stripe.checkout.sessions.create({
			payment_method_types: ['card'],
			line_items: line_items,
			mode: 'payment',
			customer_email: dto.email,
			success_url: process.env.CLIENT_SUCCESS_URL,
			cancel_url: process.env.CLIENT_CANCEL_URL,
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
	async sendOrderEmail(userEmail: string, orderDetails: any) {
		const decryptedOrderDetails = {
			...orderDetails,
			firstName: EncryptionUtility.decrypt(orderDetails.firstName),
			lastName: EncryptionUtility.decrypt(orderDetails.lastName),
			country: EncryptionUtility.decrypt(orderDetails.country),
			state: EncryptionUtility.decrypt(orderDetails.state),
			city: EncryptionUtility.decrypt(orderDetails.city),
			postCode: EncryptionUtility.decrypt(orderDetails.postCode),
			street: EncryptionUtility.decrypt(orderDetails.street),
			house: EncryptionUtility.decrypt(orderDetails.house),
			phoneCode: EncryptionUtility.decrypt(orderDetails.phoneCode),
			phone: EncryptionUtility.decrypt(orderDetails.phone),
			email: orderDetails.email
		}

		// Generating list of items
		let itemHtml = `<li><b>Purchased Items:</b><ul>`
		orderDetails.items.forEach(item => {
			itemHtml += `<li>${item.product.name} (Quantity: ${item.quantity})</li>`
		})
		itemHtml += '</ul></li>'

		const mailOptions = {
			from: process.env.EMAIL_USERNAME,
			to: userEmail,
			subject: 'Your order has been successfully paid',
			html: `
			<div style="font-family: 'Roboto', sans-serif; color: rgba(0, 0, 0, 0.87); max-width: 500px; margin: auto;">
			<h2 style="background-color: #a08750; color: #fff; margin: 0; padding: 16px;">Order Successfully Paid</h2>
			<div style="padding: 16px; border: 1px solid rgba(0, 0, 0, 0.12);">
				<strong>Hello ${decryptedOrderDetails.firstName} ${decryptedOrderDetails.lastName},</strong>
				<p style="border-bottom:1px solid #a08750;padding-bottom: 10px;">Your order has been successfully processed and paid. Here are the details of your order:</p>
				<ul style="list-style-type: none; padding: 0; border-bottom: 1px solid #a08750;padding-bottom: 10px;">
					<li><strong>Country:</strong> ${decryptedOrderDetails.country}</li>
					<li><strong>State:</strong> ${decryptedOrderDetails.state}</li>
					<li><strong>City:</strong> ${decryptedOrderDetails.city}</li>
					<li><strong>Postal Code:</strong> ${decryptedOrderDetails.postCode}</li>
					<li><strong>Street:</strong> ${decryptedOrderDetails.street}</li>
					<li><strong>House:</strong> ${decryptedOrderDetails.house}</li>
					<li><strong>Phone:</strong> ${decryptedOrderDetails.phoneCode} ${decryptedOrderDetails.phone}</li>
					<li><strong>Email:</strong> ${decryptedOrderDetails.email}</li>
					<li>
						<strong>Items:</strong> 
						${itemHtml}
					</li>
					<li><strong>Total:</strong> ${orderDetails.total}$</li>
				</ul>
				<p>If there are any issues or if you have any questions, please contact us.</p>
				<p>Best Regards, <strong>DeskCulture</strong>
			</div>
		</div>
			`
		}

		this.transporter.sendMail(mailOptions, function (error, info) {
			if (error) {
				console.error('Error sending mail: ' + error)
			} else {
				console.log('Email sent: ' + info.response)
			}
		})
	}

	async handleStripeWebhook(event: Stripe.Event) {
		switch (event.type) {
			case 'checkout.session.completed':
				const session = event.data.object as Stripe.Checkout.Session
				const orderId = session.metadata.orderId
				const paymentIntentId = session.payment_intent as string
				const customerEmail = session.customer_details.email
				if (orderId && paymentIntentId) {
					await this.prisma.order.update({
						where: { id: parseInt(orderId, 10) },
						data: {
							status: EnumOrderStatus.PAYED,
							paymentIntentId: paymentIntentId,
							email: customerEmail
						}
					})

					const order = await this.prisma.order.findUnique({
						where: { id: parseInt(orderId, 10) },
						include: {
							items: {
								include: {
									product: true
								}
							}
						}
					})

					await this.sendOrderEmail(customerEmail, order)

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
