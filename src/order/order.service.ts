import { Injectable } from '@nestjs/common'
import { EnumOrderStatus } from '@prisma/client'
import { PrismaService } from 'src/prisma.service'
import { productReturnObject } from 'src/product/return-product.object'
import Stripe from 'stripe'
import { OrderDto } from './order.dto'
const stripe = require('stripe')(process.env['SECRET_KEY'])

@Injectable()
export class OrderService {
	private readonly stripe = new Stripe(process.env['SECRET_KEY'] || '', {
		apiVersion: '2023-08-16'
	})
	constructor(private prisma: PrismaService) {}

	async getAll() {
		return this.prisma.order.findMany({
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
	}
	async getByUserId(userId: number) {
		return this.prisma.order.findMany({
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

		const order = await this.prisma.order.create({
			data: {
				status: dto.status,
				total: total,
				paymentIntentId: '',
				paymentUrl: '',
				items: {
					create: dto.items
				},
				user: userId
					? {
							connect: {
								id: userId
							}
					  }
					: undefined,
				firstName: dto.firstName,
				lastName: dto.lastName,
				country: dto.country,
				state: dto.state,
				city: dto.city,
				postCode: dto.postCode,
				street: dto.street,
				house: dto.house,
				phoneCode: dto.phoneCode,
				phone: dto.phone,
				email: dto.email
			}
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
