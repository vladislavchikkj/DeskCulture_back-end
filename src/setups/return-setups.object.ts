import { Prisma } from '@prisma/client'

export const returnSetupsObject: Prisma.CategorySelect = {
	id: true,
	name: true
}
