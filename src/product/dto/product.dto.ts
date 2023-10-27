import { Prisma } from '@prisma/client'
import { ArrayMinSize, IsNumber, IsOptional, IsString } from 'class-validator'

export class ProductDto implements Prisma.ProductUpdateInput {
	@IsString()
	name: string

	@IsNumber()
	price: number

	@IsOptional()
	@IsString()
	description: string

	@IsOptional()
	@IsString()
	info: string

	@IsOptional()
	@IsNumber()
	remains: number

	@IsString({
		each: true
	})
	@ArrayMinSize(1)
	images?: string[]

	@IsString({
		each: true
	})
	@ArrayMinSize(1)
	imagesInfo?: string[]

	@IsNumber()
	categoryId: number

	@IsNumber()
	setupsId: number
}
