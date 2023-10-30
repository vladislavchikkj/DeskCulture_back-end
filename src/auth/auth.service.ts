import {
	BadRequestException,
	Injectable,
	NotFoundException,
	UnauthorizedException
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { User } from '@prisma/client'
import { hash, verify } from 'argon2'
import { randomBytes } from 'crypto'
import * as nodemailer from 'nodemailer'
import { PrismaService } from 'src/prisma.service'
import { UserService } from 'src/user/user.service'
import { AuthDto } from './dto/auth.dto'
import { ChangePasswordDto } from './dto/change-password.dto'

@Injectable()
export class AuthService {
	private transporter
	constructor(
		private prisma: PrismaService,
		private jwt: JwtService,
		private userService: UserService
	) {
		this.transporter = nodemailer.createTransport({
			service: 'hotmail',
			auth: {
				user: process.env.EMAIL_USERNAME,
				pass: process.env.EMAIL_PASSWORD
			}
		})
	}

	async login(dto: AuthDto) {
		const user = await this.validateUser(dto)
		const tokens = await this.issueToken(user.id)

		const encryptedEmail = dto.email
		const orders = await this.prisma.order.findMany({
			where: {
				email: encryptedEmail,
				user: null
			}
		})
		for (let order of orders) {
			await this.prisma.order.update({
				where: { id: order.id },
				data: {
					user: {
						connect: { id: user.id }
					}
				}
			})
		}

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
		const userWithEmail = await this.prisma.user.findUnique({
			where: {
				email: dto.email
			}
		})

		if (userWithEmail) {
			throw new BadRequestException('User with this email already exists')
		}

		const userWithName = await this.userExistsWithName(dto.name)
		if (userWithName) {
			throw new BadRequestException('User with this name already exists')
		}

		const user = await this.prisma.user.create({
			data: {
				email: dto.email,
				name: dto.name,
				password: await hash(dto.password)
			}
		})

		const encryptedEmail = dto.email
		const orders = await this.prisma.order.findMany({
			where: {
				email: encryptedEmail,
				user: null
			}
		})
		for (let order of orders) {
			await this.prisma.order.update({
				where: { id: order.id },
				data: {
					user: {
						connect: { id: user.id }
					}
				}
			})
		}

		const tokens = await this.issueToken(user.id)

		return {
			user: this.returnUserField(user),
			...tokens
		}
	}

	async userExistsWithName(name: string): Promise<boolean> {
		const existingUser = await this.prisma.user.findUnique({ where: { name } })
		return !!existingUser
	}

	private async issueToken(userId: number) {
		const data = { id: userId }
		const accessToken = this.jwt.sign(data, {
			expiresIn: '1h'
		})
		const refreshToken = this.jwt.sign(data, {
			expiresIn: '1d'
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

	async checkUsername(name: string): Promise<boolean> {
		const existingUser = await this.prisma.user.findUnique({ where: { name } })
		return !!existingUser
	}

	async changePassword(userId: number, dto: ChangePasswordDto) {
		const user = await this.prisma.user.findUnique({
			where: { id: userId }
		})

		if (!user) throw new NotFoundException(`User not found`)

		const isValid = await verify(user.password, dto.oldPassword)

		if (!isValid) throw new UnauthorizedException('Invalid password')

		const updatedUser = await this.prisma.user.update({
			where: { id: userId },
			data: {
				password: await hash(dto.newPassword)
			}
		})
		return {
			message: 'Password successfully changed.',
			user: this.returnUserField(updatedUser)
		}
	}

	// forgot / reset password

	async forgotPassword(email: string): Promise<void> {
		const user = await this.prisma.user.findUnique({
			where: { email }
		})

		// Пользователь не найден
		if (!user) {
			return
		}

		const token = randomBytes(20).toString('hex')

		// Сохраняем токен в модели User
		await this.prisma.user.update({
			where: { email: user.email },
			data: {
				resetPasswordToken: token,
				resetPasswordExpire: new Date(Date.now() + 15 * 60 * 1000) // Токен истекает через 15 минут
			}
		})
		const DELIMITER = '<<>>'
		const mailOptions = {
			from: process.env.EMAIL_USERNAME,
			to: user.email,
			subject: 'Password Reset',
			text: `
			You received this email because you (or someone else) requested a reset of your account.\n\n
					
Please visit the following URL or copy it into your browser's address bar to complete the process:\n\n
					http://localhost:3000/auth/reset/${encodeURIComponent(
						user.email + DELIMITER + token
					)}\n\n
					
If you did not request a password reset, simply ignore this email and your password will remain the same.\n`
		}

		this.transporter.sendMail(mailOptions, function (error, info) {
			if (error) {
				console.log(error)
			} else {
				console.log('Letter sent: ' + info.response)
			}
		})
	}

	async resetPassword(email: string, token: string, newPassword: string) {
		const user = await this.prisma.user.findUnique({
			where: { email }
		})

		if (!user) throw new NotFoundException('No such user')
		if (!user.resetPasswordToken || !user.resetPasswordExpire) {
			throw new BadRequestException('Reset token is invalid')
		}
		if (user.resetPasswordToken !== token) throw new UnauthorizedException()
		if (new Date() > user.resetPasswordExpire)
			throw new BadRequestException('Reset token expired')

		// Reset password
		const hashedNewPassword = await hash(newPassword)
		await this.prisma.user.update({
			where: { email },
			data: {
				resetPasswordToken: null,
				resetPasswordExpire: null,
				password: hashedNewPassword
			}
		})
		return { message: 'Password successfully reset.' }
	}
}
