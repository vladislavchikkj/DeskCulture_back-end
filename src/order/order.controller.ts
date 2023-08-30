import { Controller, Get } from '@nestjs/common'
import { Auth } from 'src/auth/decorator/auth.decorator'
import { CurrentUser } from 'src/auth/decorator/user.decorator'
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

	// @UsePipes(new ValidationPipe())
	// @HttpCode(200)
	// @Post()
	// @Auth()
	// placeOrder(@Body() dto: OrderDto, @CurrentUser('id') userId: number) {
	// 	return this.orderService.placeOrder(dto, userId)
	// }

	// @HttpCode(200)
	// @Post('status')
	// async updateStatus(@Body() dto: PaymentStatusDto) {
	// 	return this.orderService.updateStatus(dto)
	// }
}
