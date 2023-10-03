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
	getAll() {
		return this.orderService.getAll()
	}
	@Get('by-user')
	@Auth()
	getByUserId(@CurrentUser('id') userId: number) {
		return this.orderService.getByUserId(userId)
	}

	@UsePipes(new ValidationPipe())
	@HttpCode(200)
	@Post()
	async placeOrder(@Body() dto: OrderDto & { userId?: number }) {
		try {
			const result = await this.orderService.placeOrder(dto, dto.userId)
			return {
				orderResponse: result
			}
		} catch (error) {
			return { error: error.message }
		}
	}

	@Post('webhook')
	@StripeWebhook()
	async webhook(@Body() event: Stripe.Event) {
		return this.orderService.handleStripeWebhook(event)
	}
}
