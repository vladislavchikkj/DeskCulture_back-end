import {
	Body,
	Controller,
	HttpCode,
	Patch,
	Post,
	UseGuards,
	UsePipes,
	ValidationPipe
} from '@nestjs/common'
import { User } from '@prisma/client'
import { AuthService } from './auth.service'
import { CurrentUser } from './decorator/user.decorator'
import { AuthDto } from './dto/auth.dto'
import { ChangePasswordDto } from './dto/change-password.dto'
import { ForgotPasswordDto } from './dto/forgot-password.dto'
import { RefreshTokenDto } from './dto/refresh-token.dto'
import { ResetPasswordDto } from './dto/reset-password.dto'
import { JwtAuthGuard } from './guards/jwt.guard'

@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@UsePipes(new ValidationPipe())
	@HttpCode(200)
	@Post('login')
	async login(@Body() dto: AuthDto) {
		return this.authService.login(dto)
	}

	@UsePipes(new ValidationPipe())
	@HttpCode(200)
	@Post('login/access-token')
	async getNewTokens(@Body() dto: RefreshTokenDto) {
		return this.authService.getNewTokens(dto.refreshToken)
	}

	@UsePipes(new ValidationPipe())
	@HttpCode(200)
	@Post('register')
	async register(@Body() dto: AuthDto) {
		return this.authService.register(dto)
	}

	@UsePipes(new ValidationPipe())
	@UseGuards(JwtAuthGuard)
	@HttpCode(200)
	@Patch('change-password')
	async changePassword(
		@CurrentUser() user: User,
		@Body() dto: ChangePasswordDto
	) {
		return this.authService.changePassword(user.id, dto)
	}

	@Post('forgot-password')
	async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
		return this.authService.forgotPassword(forgotPasswordDto.email)
	}

	@Patch('reset-password')
	async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
		const { email, token, newPassword } = resetPasswordDto
		return this.authService.resetPassword(email, token, newPassword)
	}
}
