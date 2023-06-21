import { ConfigService } from '@nestjs/config'
import { Injectable } from '@nestjs/common'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { PrismaService } from 'src/prisma.service'
import { PassportStrategy } from '@nestjs/passport'
import { User } from '@prisma/client'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(
		private readonly ConfigService: ConfigService,
		private prisma: PrismaService
	) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: true,
			secretOrKey: ConfigService.get('JWT_SECRET')
		})
	}
	async validate({ id }: Pick<User, 'id'>) {
		return this.prisma.findUnique({ where: { id: +id } })
	}
}
