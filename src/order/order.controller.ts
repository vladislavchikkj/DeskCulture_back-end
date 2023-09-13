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
import { OrderDto } from './order.dto'
import { OrderService } from './order.service'

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
	@Post()
	@Auth()
	placeOrder(@Body() dto: OrderDto, @CurrentUser('id') userId: number) {
		return this.orderService.placeOrder(dto, userId)
	}

	@Get('test-stripe')
	stripe() {
		return this.orderService.testStripe()
	}

	@UsePipes(new ValidationPipe())
	@HttpCode(200)
	@Post('create-stripe-session')
	@Auth()
	async createStripeSession(
		@Body() dto: OrderDto,
		@CurrentUser('id') userId: number
	) {
		return this.orderService.createStripeSession(userId, dto)
	}
}
