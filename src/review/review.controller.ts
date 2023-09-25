import {
	Body,
	Controller,
	Get,
	HttpCode,
	Param,
	Post,
	UploadedFile,
	UseInterceptors,
	UsePipes,
	ValidationPipe
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { Auth } from 'src/auth/decorator/auth.decorator'
import { CurrentUser } from 'src/auth/decorator/user.decorator'
import { multerConfig } from 'src/multer-config'
import { ReviewDto } from './review.dto'
import { ReviewService } from './review.service'

@Controller('reviews')
export class ReviewController {
	constructor(private reviewService: ReviewService) {}

	@UsePipes(new ValidationPipe())
	@Get()
	@Auth('admin')
	async getAll() {
		return this.reviewService.getAll()
	}

	@UsePipes(new ValidationPipe())
	@HttpCode(200)
	@Post('leave/:productId')
	@Auth()
	@UseInterceptors(FileInterceptor('image', multerConfig))
	async leaveReview(
		@UploadedFile() file,
		@CurrentUser('id') id: number,
		@Body() dto: ReviewDto,
		@Param('productId') productId: string
	) {
		return this.reviewService.create(id, dto, +productId, file)
	}

	@Get('average-by-product/:productId')
	async getAverageByProduct(@Param('productId') productId: string) {
		return this.reviewService.getAverageValueByProductId(+productId)
	}

	@Post('test')
	@UseInterceptors(FileInterceptor('test', multerConfig))
	async uploadFile() {
		return 'success-load-test'
	}
}
