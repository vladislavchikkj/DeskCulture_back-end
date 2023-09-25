import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma.service'
import { ProductService } from 'src/product/product.service'
import { UserService } from 'src/user/user.service'
import { returnReviewObject } from './return-review.object'
import { ReviewDto } from './review.dto'

@Injectable()
export class ReviewService {
	constructor(
		private prisma: PrismaService,
		private productService: ProductService,
		private userService: UserService
	) {}

	async getAll() {
		return this.prisma.review.findMany({
			orderBy: {
				createdAt: 'desc'
			},
			select: returnReviewObject
		})
	}
	async create(
		userId: number,
		dto: ReviewDto,
		productId: number,
		imageFile?: Express.Multer.File
	) {
		await this.productService.byId(productId)
		const userDetails = await this.userService.byId(userId) // Получаем данные о пользователе

		const createdReview = await this.prisma.review.create({
			data: {
				...dto,
				imageUrl: imageFile?.filename ?? null,
				product: {
					connect: {
						id: productId
					}
				},
				user: {
					connect: {
						id: userId
					}
				}
			},
			include: {
				user: true
			}
		})

		return {
			...createdReview,
			username: userDetails.name // Возврат имени пользователя
		}
	}

	async getAverageValueByProductId(productId: number) {
		return this.prisma.review
			.aggregate({
				where: { productId },
				_avg: {
					rating: true
				}
			})
			.then(data => data._avg)
	}
}
