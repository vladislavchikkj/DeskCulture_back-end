import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma.service'
import { productReturnObject } from 'src/product/return-product.object'
import { OrderDto } from './order.dto'
const stripe = require('stripe')(
	'sk_test_51No31nI1hIbz2Fn3gSFCP8XAJdxLtVTo35LNvt8xpfnABjCaEIEGaKikafZDiNfNnFA7Laq1wsPuLjQNVuJoyJtO001WtDvurS'
)

@Injectable()
export class OrderService {
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
	async placeOrder(dto: OrderDto, userId: number) {
		const total = dto.items.reduce((acc, item) => {
			return acc + item.price * item.quantity
		}, 0)

		const order = await this.prisma.order.create({
			data: {
				status: dto.status,
				total: total,
				items: {
					create: dto.items
				},
				user: {
					connect: {
						id: userId
					}
				}
			}
		})
		return order
	}

	async testStripe() {
		const session = await stripe.checkout.sessions.create({
			line_items: [{ price: 'price_1NpqqyI1hIbz2Fn30rC12laW', quantity: 3 }],
			mode: 'payment',
			payment_intent_data: {
				setup_future_usage: 'on_session'
			},
			customer: 'cus_Od7Da00Y0upE4J',
			success_url:
				'http://localhost:4200' +
				'/pay/success/checkout/session?session_id={CHECKOUT_SESSION_ID}',
			cancel_url: 'http://localhost:3000' + '/pay/failed/checkout/session'
		})

		return session
	}

	async SuccessSession(Session) {
		console.log(Session)
	}

	async createStripeSession(userId: number, dto: OrderDto) {
		const line_items = dto.items.map(item => {
			return {
				price_data: {
					currency: 'usd', // замените на валюту, которую вы используете
					product_data: {
						name: '[Product Name]', // замените на название продукта
						description: '[Product Description]' // замените на описание продукта
					},
					unit_amount: item.price * 100
				},
				quantity: item.quantity
			}
		})

		const session = await stripe.checkout.sessions.create({
			payment_method_types: ['card'],
			line_items,
			mode: 'payment',
			success_url: 'http://localhost:4200/success',
			cancel_url: 'http://localhost:4200/cancel'
		})

		return session
	}
}

//yooKassa

// 	const payment = await yooKassa.createPayment({
// 		amount: {
// 			value: total.toFixed(2),
// 			currency: 'RUB'
// 		},
// 		payment_method_data: {
// 			type: 'bank_card'
// 		},
// 		confirmation: {
// 			type: 'redirect',
// 			return_url: 'http://localhost:3000/thanks'
// 		},
// 		description: `Order #${order.id}`
// 	})

// 	return payment
// }

// async updateStatus(dto: PaymentStatusDto) {
// 	if (dto.event === 'payment.waiting_for_capture') {
// 		const payment = await yooKassa.capturePayment(dto.object.id)
// 		return payment
// 	}
// 	if (dto.event === 'payment.succeeded') {
// 		const orderId = Number(dto.object.description.split('#')[1])
// 		await this.prisma.order.update({
// 			where: {
// 				id: orderId
// 			},
// 			data: {
// 				status: EnumOrderStatus.PAYED
// 			}
// 		})
// 		return true
// 	}
// }
