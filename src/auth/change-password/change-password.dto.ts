import { IsString, MinLength } from 'class-validator'

export class ChangePasswordDto {
	@MinLength(6, {
		message: 'Пароль должен содержать не менее 6 символов'
	})
	@IsString()
	oldPassword: string

	@MinLength(6, {
		message: 'Пароль должен содержать не менее 6 символов'
	})
	@IsString()
	newPassword: string
}
