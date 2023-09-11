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
import { AuthService } from './auth.service'
import { ChangePasswordDto } from './change-password/change-password.dto'
import { CurrentUser } from './decorator/user.decorator'
import { AuthDto } from './dto/auth.dto'
import { RefreshTokenDto } from './dto/refresh-token.dto'
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

	@UseGuards(JwtAuthGuard)
	@Patch('change-password')
	async changePassword(
		@CurrentUser('id') userId: number,
		@Body(new ValidationPipe()) changePasswordDto: ChangePasswordDto
	): Promise<boolean> {
		return this.authService.changePassword(userId, changePasswordDto)
	}
}

// @Post('forgotPassword')
// async forgotPassword(
// 	@Body(new ValidationPipe()) ForgotPasswordDto: ForgotPasswordDto
// ): Promise<void> {}

// @Patch('changePassword')
// @UseGuards(AuthGuard())
// async changePassword(
// 	@CurrentUser('id')
// 	@Body(new ValidationPipe())
// 	ChangePasswordDto: ChangePasswordDto
// ): Promise<void> {
// 	return this.authService.changePassword(user._id, changePasswordDto)
// }
