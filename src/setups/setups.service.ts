import { Injectable } from '@nestjs/common'
import { Product, Setups } from '@prisma/client'
import { PrismaService } from 'src/prisma.service'
import { returnSetupsObject } from './return-setups.object'
import { SetupsDto } from './setups.dto'

@Injectable()
export class SetupsService {
	constructor(private prisma: PrismaService) {}

	async getAll() {
		return this.prisma.setups.findMany({
			select: returnSetupsObject
		})
	}

	async byId(id: number) {
		const setup = await this.prisma.setups.findUnique({
			where: { id },
			select: {
				...returnSetupsObject,
				products: {
					select: {
						id: true,
						name: true,
						images: true,
						info: true
						// Другие поля продукта, которые вы хотите выбрать
					}
				}
			}
		})

		if (!setup) {
			throw new Error('Setups not found')
		}

		return setup
	}
	async create(dto: SetupsDto, imageFile?: Express.Multer.File) {
		return this.prisma.setups.create({
			data: {
				name: dto.name,
				image: imageFile
					? `${process.env['SERVER_URL']}/uploads/${imageFile.filename}`
					: null,
				description: dto.description
			}
		})
	}

	async update(id: number, dto: SetupsDto, imageFile?: Express.Multer.File) {
		return this.prisma.setups.update({
			where: { id },
			data: {
				name: dto.name,
				image: imageFile
					? `${process.env['SERVER_URL']}/uploads/${imageFile.filename}`
					: null,
				description: dto.description
			}
		})
	}
	async delete(id: number) {
		return this.prisma.setups.delete({
			where: { id }
		})
	}
	async addProductToSetup(setupId: number, productId: number): Promise<Setups> {
		// Создаем новую запись в ProductInSetups для связи продукта с сетапом
		await this.prisma.productInSetups.create({
			data: {
				setup: { connect: { id: setupId } },
				product: { connect: { id: productId } }
			}
		})

		// Возвращаем обновленный сетап
		return this.prisma.setups.findUnique({
			where: { id: setupId },
			include: { products: true }
		})
	}

	async getProductsInSetup(setupId: number): Promise<Product[]> {
		return this.prisma.productInSetups
			.findMany({
				where: { setupId: { equals: setupId } },
				include: { product: true }
			})
			.then(productInSetups => productInSetups.map(pis => pis.product))
	}
}
