import { IsString } from 'class-validator'

export class SetupsDto {
	@IsString()
	name: string
}
