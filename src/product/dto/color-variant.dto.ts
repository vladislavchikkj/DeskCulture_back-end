import { Type } from 'class-transformer'
import { IsArray, IsInt, IsOptional, IsString } from 'class-validator'

export class ColorVariantDto {
	@IsInt()
	@Type(() => Number)
	productId: number

	@IsString()
	color: string

	@IsArray()
	@IsString({ each: true })
	@IsOptional()
	images?: string[]
}
