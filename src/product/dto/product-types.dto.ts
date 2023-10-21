import { Type } from 'class-transformer'
import { IsArray, IsInt, IsOptional, IsString } from 'class-validator'

export class ProductTypeDto {
	@IsInt()
	@Type(() => Number)
	productId: number

	@IsString()
	@IsOptional()
	color: string

	@IsString()
	@IsOptional()
	type: string

	@IsArray()
	@IsString({ each: true })
	@IsOptional()
	images?: string[]
}
