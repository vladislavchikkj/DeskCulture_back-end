import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from 'src/prisma.service'
import { CategoryDto } from './category.dto'
import { returnCategoryObject } from './return-category.object'

@Injectable()
export class CategoryService {
	constructor(private prisma: PrismaService) {}

	async byId(id: number) {
		const category = await this.prisma.category.findUnique({
			where: { id },
			select: returnCategoryObject
		})
		if (!category) {
			throw new Error('Category not found')
		}
		return category
	}
	async bySlug(slug: string) {
		const category = await this.prisma.category.findUnique({
			where: { slug },
			select: returnCategoryObject
		})
		if (!category) {
			throw new NotFoundException('Category not found')
		}
		return category
	}

	async getAll() {
		return this.prisma.category.findMany({
			select: returnCategoryObject
		})
	}
	async create(dto: CategoryDto, imageFile?: Express.Multer.File) {
		return this.prisma.category.create({
			data: {
				name: dto.name,
				slug: dto.slug,
				image: imageFile
					? `${process.env['SERVER_URL']}/uploads/${imageFile.filename}`
					: null,
				description: dto.description
			}
		})
	}

	async update(id: number, dto: CategoryDto, imageFile?: Express.Multer.File) {
		return this.prisma.category.update({
			where: { id },
			data: {
				name: dto.name,
				slug: dto.slug,
				image: imageFile
					? `${process.env['SERVER_URL']}/uploads/${imageFile.filename}`
					: null,
				description: dto.description
			}
		})
	}
	async delete(id: number) {
		return this.prisma.category.delete({
			where: { id }
		})
	}
}
