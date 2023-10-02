import { IsString } from 'class-validator'

export class SetupsDto {
	@IsString()
	name: string

	@IsString()
	description: string

	@IsString()
	images?: string
}
