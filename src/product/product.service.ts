import { Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PaginationService } from 'src/pagination/pagination.service'
import { PrismaService } from 'src/prisma.service'
import { ProductDto } from 'src/product/dto/product.dto'
import {
	productReturnObject,
	productReturnObjectFullest
} from 'src/product/return-product.object'
import { generateSlug } from 'src/utils/generate-slug'
import { EnumProductSort, GetAllProductDto } from './dto/get-all.product.dto'

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
		private paginationService: PaginationService
	) {}

	async getAll(dto: GetAllProductDto = {}) {
		const { sort, searchTerm } = dto

		const prismaSort: Prisma.ProductOrderByWithRelationInput[] = []

		if (sort === EnumProductSort.LOW_PRICE) {
			prismaSort.push({
				price: 'asc'
			})
		} else if (sort === EnumProductSort.HIGH_PRICE) {
			prismaSort.push({
				price: 'desc'
			})
		} else if (sort === EnumProductSort.OLDEST) {
			prismaSort.push({
				createdAt: 'asc'
			})
		} else {
			prismaSort.push({ createdAt: 'desc' })
		}

		const prismaSearchTermFilter: Prisma.ProductWhereInput = searchTerm
			? {
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
			: {}

		const { perPage, skip } = this.paginationService.getPagination(dto)

		const products = await this.prisma.product.findMany({
			where: prismaSearchTermFilter,
			orderBy: prismaSort,
			skip: skip,
			take: perPage,
			select: productReturnObject
		})

		return {
			products,
			length: await this.prisma.product.count({
				where: prismaSearchTermFilter
			})
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

	async create() {
		const product = await this.prisma.product.create({
			data: {
				description: '',
				name: '',
				price: 0,
				slug: ''
			}
		})
		return product.id
	}

	async update(id: number, dto: ProductDto) {
		const { description, images, price, name, categoryId } = dto

		return this.prisma.product.update({
			where: { id },
			data: {
				description,
				images,
				price,
				name,
				slug: generateSlug(name),
				category: {
					connect: {
						id: categoryId
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

		// Затем удаляем сам продукт
		return this.prisma.product.delete({
			where: { id }
		})
	}
}
