import { IsNotEmpty, IsString } from 'class-validator'

export class CheckUsernameDto {
	@IsNotEmpty()
	@IsString()
	name: string
}
