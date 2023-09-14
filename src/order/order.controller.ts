import {
	Body,
	Controller,
	Get,
	HttpCode,
	Post,
	UsePipes,
	ValidationPipe
} from '@nestjs/common'
import { Auth } from 'src/auth/decorator/auth.decorator'
import { CurrentUser } from 'src/auth/decorator/user.decorator'
import Stripe from 'stripe'
import { OrderDto } from './order.dto'
import { OrderService } from './order.service'
import { StripeWebhook } from './stripe-webhook.decorator'

@Controller('orders')
export class OrderController {
	constructor(private readonly orderService: OrderService) {}

	@Get()
	@Auth('admin')
	getAll(@CurrentUser('id') userId: number) {
		return this.orderService.getAll()
	}
	@Get('by-user')
	@Auth()
	getByUserId(@CurrentUser('id') userId: number) {
		return this.orderService.getByUserId(userId)
	}

	@UsePipes(new ValidationPipe())
	@HttpCode(200)
	@Post('create-stripe-session')
	@Auth()
	async placeOrder(@Body() dto: OrderDto, @CurrentUser('id') userId: number) {
		try {
			console.log('Получено событие!!')
			const result = await this.orderService.placeOrder(dto, userId)
			return {
				order: result.order,
				confirmationUrl: result
			}
		} catch (error) {
			return { error: error.message }
		}
	}

	@Post('webhook')
	@StripeWebhook()
	async webhook(@Body() event: Stripe.Event) {
		console.log('Получено событие от Stripe:', event)
		return this.orderService.handleStripeWebhook(event)
	}
}
