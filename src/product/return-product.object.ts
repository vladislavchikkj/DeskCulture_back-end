import { Prisma } from '@prisma/client'
import { returnCategoryObject } from 'src/category/return-category.object'
import { returnReviewObject } from 'src/review/return-review.object'

export const productReturnObject: Prisma.ProductSelect = {
	images: true,
	description: true,
	id: true,
	name: true,
	price: true,
	createdAt: true,
	setups: true,
	slug: true,
	category: {
		select: returnCategoryObject
	},
	reviews: {
		select: returnReviewObject,
		orderBy: {
			createdAt: 'desc'
		}
	}
}

export const productReturnObjectFullest: Prisma.ProductSelect = {
	...productReturnObject
}
