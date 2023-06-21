import { faker } from '@faker-js/faker'
import { BadRequestException, Injectable } from '@nestjs/common'
import { hash } from 'argon2'
import { PrismaService } from 'src/prisma.service'
import { AuthDto } from './auth.dto'

@Injectable()
export class AuthService {
	constructor(private prisma: PrismaService) {}

	async register(dto: AuthDto) {
		const oldUser = await this.prisma.user.findUnique({
			where: {
				email: dto.email
			}
		})
		if (oldUser) throw new BadRequestException(`User already exists`)
		const user = await this.prisma.user.create({
			data: {
				email: dto.email,
				name: faker.name.firstName(),
				phone: faker.phone.number('+9 (###) ###-##-##'),
				password: await hash(dto.password)
			}
		})
		return user
	}
	private async issueToken(userId: number) {
		const data = { id: userId }
		// const accessToken = this.jwtService.sign
	}
}
