import { IsString } from 'class-validator'

export class CategoryDto {
	@IsString()
	name: string

	@IsString()
	slug: string

	@IsString()
	description: string

	@IsString()
	images?: string
}
