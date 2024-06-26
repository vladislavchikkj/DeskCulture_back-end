import { Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { CategoryService } from 'src/category/category.service'
import { PaginationService } from 'src/pagination/pagination.service'
import { PrismaService } from 'src/prisma.service'
import { ProductDto } from 'src/product/dto/product.dto'
import {
	productReturnObject,
	productReturnObjectFullest
} from 'src/product/return-product.object'
import { convertToNumber } from 'src/utils/convert-to-number'
import { generateSlug } from 'src/utils/generate-slug'
import { EnumProductSort, GetAllProductDto } from './dto/get-all.product.dto'
import { ProductTypeDto } from './dto/product-types.dto'

@Injectable()
export class ProductService {
	getSlug(slug: string) {
		throw new Error('Method not implemented.')
	}
	getSimilar(arg0: number) {
		throw new Error('Method not implemented.')
	}
	constructor(
		private prisma: PrismaService,
		private paginationService: PaginationService,
		private categoryService: CategoryService
	) {}

	async getAll(dto: GetAllProductDto = {}) {
		const { perPage, skip } = this.paginationService.getPagination(dto)

		const filters = this.createFilter(dto)

		const products = await this.prisma.product.findMany({
			where: filters,
			orderBy: this.getSortOption(dto.sort),
			skip: skip,
			take: perPage,
			select: productReturnObject
		})

		return {
			products,
			length: await this.prisma.product.count({
				where: filters
			})
		}
	}

	private createFilter(dto: GetAllProductDto): Prisma.ProductWhereInput {
		const filters: Prisma.ProductWhereInput[] = []

		if (dto.searchTerm) filters.push(this.getSearchTermFilter(dto.searchTerm))
		if (dto.ratings)
			filters.push(
				this.getRatingFilter(dto.ratings.split('|').map(rating => +rating))
			)
		if (dto.minPrice || dto.maxPrice)
			filters.push(
				this.getPriceFilter(
					convertToNumber(dto.minPrice),
					convertToNumber(dto.maxPrice)
				)
			)
		if (dto.categoryId) filters.push(this.getCategoryFilter(+dto.categoryId))
		return filters.length ? { AND: filters } : {}
	}

	private getSortOption(
		sort: EnumProductSort
	): Prisma.ProductOrderByWithRelationInput[] {
		switch (sort) {
			case EnumProductSort.LOW_PRICE:
				return [{ price: 'asc' }]
			case EnumProductSort.HIGH_PRICE:
				return [{ price: 'desc' }]
			case EnumProductSort.OLDEST:
				return [{ createdAt: 'asc' }]
			default:
				return [{ createdAt: 'desc' }]
		}
	}

	private getSearchTermFilter(searchTerm: string): Prisma.ProductWhereInput {
		return {
			OR: [
				{
					category: {
						name: {
							contains: searchTerm,
							mode: 'insensitive'
						}
					}
				},
				{
					name: {
						contains: searchTerm,
						mode: 'insensitive'
					}
				},
				{
					description: {
						contains: searchTerm,
						mode: 'insensitive'
					}
				}
			]
		}
	}

	private getRatingFilter(ratings: number[]): Prisma.ProductWhereInput {
		return {
			reviews: {
				some: {
					rating: {
						in: ratings
					}
				}
			}
		}
	}

	private getPriceFilter(
		minPrice?: number,
		maxPrice?: number
	): Prisma.ProductWhereInput {
		let priceFilter: Prisma.IntFilter | undefined = undefined

		if (minPrice) {
			priceFilter = {
				...priceFilter,
				gte: minPrice
			}
		}

		if (maxPrice) {
			priceFilter = {
				...priceFilter,
				lte: maxPrice
			}
		}
		return {
			price: priceFilter
		}
	}

	private getCategoryFilter(categoryId: number): Prisma.ProductWhereInput {
		return {
			categoryId
		}
	}

	async byId(id: number) {
		const product = await this.prisma.product.findUnique({
			where: { id },
			select: productReturnObjectFullest
		})
		if (!product) {
			throw new NotFoundException('Product not found')
		}
		return product
	}

	async bySlug(slug: string) {
		const product = await this.prisma.product.findMany({
			where: { slug },
			select: productReturnObjectFullest
		})

		if (!product) {
			throw new NotFoundException('Product not found')
		}
		return product
	}

	async byCategory(categorySlug: string) {
		const products = await this.prisma.product.findMany({
			where: {
				category: {
					slug: categorySlug
				}
			},
			orderBy: {
				createdAt: 'desc'
			},
			select: productReturnObjectFullest
		})

		if (products.length === 0) {
			throw new NotFoundException('Product not found')
		}

		return products
	}
	async bySetupsId(setupsId: number) {
		const products = await this.prisma.product.findMany({
			where: { setupsId },
			select: productReturnObjectFullest
		})

		if (!products || products.length === 0) {
			throw new NotFoundException('No products with the given setupsId')
		}

		return products
	}

	async bySimilar(id: number) {
		const currentProduct = await this.byId(id)

		const products = await this.prisma.product.findMany({
			where: {
				category: {
					slug: currentProduct.category.slug
				},
				NOT: {
					id: currentProduct.id
				}
			},
			orderBy: {
				createdAt: 'desc'
			},
			select: productReturnObject
		})

		return products
	}

	async create(
		dto: ProductDto,
		filesImages: Express.Multer.File[],
		filesImagesInfo: Express.Multer.File[]
	) {
		const { description, price, name, categoryId, setupsId, info, remains } =
			dto
		const serverAddress = process.env.SERVER_URL
		const parsedCategoryId = Number(categoryId)
		const parsedSetupsId = Number(setupsId)
		const parsedPrice = Number(price)
		const parsedRemains = Number(remains)

		const images: string[] = filesImages.map(
			file => serverAddress + `/${file.path}`
		)
		const imagesInfo: string[] = filesImagesInfo.map(
			file => serverAddress + `/${file.path}`
		)

		await this.categoryService.byId(parsedCategoryId)

		return this.prisma.product.create({
			data: {
				description,
				name,
				price: parsedPrice,
				slug: generateSlug(name),
				images,
				imagesInfo,
				categoryId: parsedCategoryId,
				setupsId: parsedSetupsId,
				info,
				remains: parsedRemains
			}
		})
	}

	async update(
		id: number,
		dto: ProductDto,
		filesImages: Express.Multer.File[],
		filesImagesInfo: Express.Multer.File[]
	) {
		const { description, price, name, categoryId, setupsId, info, remains } =
			dto
		const serverAddress = process.env.SERVER_URL
		const parsedCategoryId = Number(categoryId)
		const parsedSetupsId = Number(setupsId)
		const parsedPrice = Number(price)
		const parsedId = Number(id)
		const parsedRemains = Number(remains)

		const images: string[] = filesImages.map(
			file => serverAddress + `/${file.path}`
		)
		const imagesInfo: string[] = filesImagesInfo.map(
			file => serverAddress + `/${file.path}`
		)

		await this.categoryService.byId(parsedCategoryId)

		return this.prisma.product.update({
			where: { id: parsedId },
			data: {
				description,
				price: parsedPrice,
				name,
				slug: generateSlug(name),
				images,
				imagesInfo,
				info,
				remains: parsedRemains,
				category: {
					connect: {
						id: parsedCategoryId
					}
				},
				setups: {
					connect: {
						id: parsedSetupsId
					}
				}
			}
		})
	}
	async delete(id: number) {
		// Сначала удаляем связанные отзывы продукта
		await this.prisma.review.deleteMany({
			where: { productId: id } // Удалить все отзывы с совпадающим productId
		})

		await this.prisma.orderItem.deleteMany({
			where: { productId: id }
		})

		// Затем удаляем сам продукт
		return this.prisma.product.delete({
			where: { id }
		})
	}

	// variants

	async createProductType(
		productId: number,
		dto: ProductTypeDto,
		files: Express.Multer.File[]
	) {
		const { color } = dto
		const { type } = dto
		const serverAddress = process.env.SERVER_URL
		const images: string[] = files.map(file => serverAddress + `/${file.path}`)

		return this.prisma.productType.create({
			data: {
				color,
				type,
				images,
				product: {
					connect: { id: productId }
				}
			}
		})
	}

	async updateProductType(
		productId: number,
		productTypeId: number,
		dto: ProductTypeDto,
		files: Express.Multer.File[]
	) {
		const { color } = dto
		const { type } = dto
		const serverAddress = process.env.SERVER_URL
		const images: string[] = files.map(file => serverAddress + `/${file.path}`)

		return this.prisma.productTypes.update({
			where: { id: productTypeId },
			data: {
				color,
				type,
				images,
				product: {
					connect: { id: productId }
				}
			}
		})
	}

	async updateProductTypeName(
		productId: number,
		productTypeId: number,
		dto: Partial<ProductTypeDto>
	) {
		return this.prisma.productType.update({
			where: { id: productTypeId },
			data: {
				color: dto.color,
				product: {
					connect: { id: productId }
				}
			}
		})
	}

	async updateProductTypeImages(
		productId: number,
		productTypeId: number,
		files: Express.Multer.File[]
	) {
		const serverAddress = process.env.SERVER_URL
		const images: string[] = files.map(file => serverAddress + `/${file.path}`)

		return this.prisma.productType.update({
			where: { id: productTypeId },
			data: {
				images,
				product: {
					connect: { id: productId }
				}
			}
		})
	}

	async deleteProductType(productId: number, productTypeId: number) {
		return this.prisma.productType.delete({
			where: { id: productTypeId }
		})
	}
}
