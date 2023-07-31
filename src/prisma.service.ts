import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
	[x: string]: any
	// findUnique(arg0: { where: { id: number } }) {
	// 	throw new Error('Method not implemented.')
	// }
	findUnique(args: {
		where: {
			id: number
		}
	}) {
		return this.user.findUnique(args)
	}
	async onModuleInit() {
		await this.$connect()
	}

	async enableShutdownHooks(app: INestApplication) {
		this.$on('beforeExit', async () => {
			await app.close()
		})
	}
}
