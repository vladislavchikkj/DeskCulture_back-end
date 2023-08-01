import { Prisma } from '@prisma/client'

export const returnSetupsObject: Prisma.SetupsSelect = {
	id: true,
	name: true,
	description: true,
	image: true
}
