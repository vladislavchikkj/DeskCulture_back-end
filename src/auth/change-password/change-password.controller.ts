// import { Body, Controller, Post, UseGuards } from '@nestjs/common'
// import { AuthGuard } from '@nestjs/passport' // Если вы используете аутентификацию через Passport
// import { AuthService } from '../auth.service'
// import { ChangePasswordDto } from './change-password.dto'

// @Controller('auth')
// export class ChangePasswordController {
// 	constructor(private readonly authService: AuthService) {}

// 	@Post('change-password')
// 	@UseGuards(AuthGuard()) // Добавьте необходимые гварды аутентификации
// 	async changePassword(@Body() changePasswordDto: ChangePasswordDto) {
// 		// Здесь вы можете добавить логику для смены пароля
// 		return this.authService.changePassword(changePasswordDto)
// 	}
// }
