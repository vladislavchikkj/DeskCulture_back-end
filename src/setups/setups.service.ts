import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma.service'
import { returnSetupsObject } from './return-setups.object'
import { SetupsDto } from './setups.dto'

@Injectable()
export class SetupsService {
	constructor(private prisma: PrismaService) {}

	async byId(id: number) {
		const setups = await this.prisma.setups.findUnique({
			where: { id },
			select: returnSetupsObject
		})
		if (!setups) {
			throw new Error('Setups not found')
		}
		return setups
	}

	async getAll() {
		return this.prisma.setups.findMany({
			select: returnSetupsObject
		})
	}
	async create() {
		return this.prisma.setups.create({
			data: {
				name: '',
				description: '',
				image: ''
			}
		})
	}

	async update(id: number, dto: SetupsDto) {
		return this.prisma.setups.update({
			where: { id },
			data: {
				name: dto.name
			}
		})
	}
	async delete(id: number) {
		return this.prisma.setups.delete({
			where: { id }
		})
	}
}
