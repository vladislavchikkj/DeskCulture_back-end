import {
	BadRequestException,
	Injectable,
	NotFoundException,
	UnauthorizedException
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { User } from '@prisma/client'
import { hash, verify } from 'argon2'
import { PrismaService } from 'src/prisma.service'
import { UserService } from 'src/user/user.service'
import { ChangePasswordDto } from './change-password/change-password.dto'
import { AuthDto } from './dto/auth.dto'
import { ForgotPasswordDto } from './dto/forgot-password.dto'

@Injectable()
export class AuthService {
	constructor(
		private prisma: PrismaService,
		private jwt: JwtService,
		private userService: UserService
	) {}

	async login(dto: AuthDto) {
		const user = await this.validateUser(dto)
		const tokens = await this.issueToken(user.id)

		return {
			user: this.returnUserField(user),
			...tokens
		}
	}

	async getNewTokens(refreshToken: string) {
		const result = await this.jwt.verify(refreshToken)
		if (!result) throw new UnauthorizedException('Invalid refresh token')

		const user = await this.userService.byId(result.id, {
			isAdmin: true
		})
		const tokens = await this.issueToken(user.id)

		return {
			user: this.returnUserField(user),
			...tokens
		}
	}

	async register(dto: AuthDto) {
		const oldUser = await this.prisma.user.findUnique({
			where: {
				email: dto.email
			}
		})
		if (oldUser) {
			throw new BadRequestException(`User already exists`)
		}

		const user = await this.prisma.user.create({
			data: {
				email: dto.email,
				name: dto.name, // Use the provided name from DTO
				password: await hash(dto.password)
			}
		})

		const tokens = await this.issueToken(user.id)

		return {
			user: this.returnUserField(user),
			...tokens
		}
	}

	private async issueToken(userId: number) {
		const data = { id: userId }
		const accessToken = this.jwt.sign(data, {
			expiresIn: '1h'
		})
		const refreshToken = this.jwt.sign(data, {
			expiresIn: '7d'
		})
		return { accessToken, refreshToken }
	}

	private returnUserField(user: Partial<User>) {
		return {
			id: user.id,
			email: user.email,
			isAdmin: user.isAdmin
		}
	}

	private async validateUser(dto: AuthDto) {
		const user = await this.prisma.user.findUnique({
			where: {
				email: dto.email
			}
		})
		if (!user) throw new NotFoundException(`User not found`)

		const isValid = await verify(user.password, dto.password)
		if (!isValid) throw new UnauthorizedException('Invalid password')
		return user
	}

	// CHANGE PASSWORD

	// async changePassword(
	// 	userId: string,
	// 	changePasswordDto: ChangePasswordDto
	// ): Promise<boolean> {
	// 	const password = await this.userService.hashPassword(
	// 		changePasswordDto.password
	// 	)

	// 	await this.userService.updateProfile(userId, { password })
	// 	await this.tokenService.deleteAll(userId)
	// 	return true
	// }

	private async forgotPassword(
		forgotPasswordDto: ForgotPasswordDto
	): Promise<void> {
		const user = this.userService.findByEmail(forgotPasswordDto.email)

		if (!user) {
			throw new BadRequestException('Invalid email')
		}
	}

	async changePassword(userId: number, changePasswordDto: ChangePasswordDto) {
		const user = await this.userService.byId(userId)

		if (!user) {
			throw new NotFoundException('Пользователь не найден')
		}

		const isValid = await verify(user.password, changePasswordDto.oldPassword)

		if (!isValid) {
			throw new UnauthorizedException('Неверный старый пароль')
		}

		const newPasswordHash = await hash(changePasswordDto.newPassword)

		await this.prisma.user.update({
			where: { id: userId },
			data: { password: newPasswordHash }
		})

		return true
	}
}
