import { Prisma } from '@prisma/client'
import { returnCategoryObject } from 'src/category/return-category.object'
import { returnReviewObject } from 'src/review/return-review.object'

export const productReturnObject: Prisma.ProductSelect = {
	images: true,
	imagesInfo: true,
	description: true,
	id: true,
	name: true,
	price: true,
	createdAt: true,
	setups: true,
	slug: true,
	info: true,
	remains: true,
	category: {
		select: returnCategoryObject
	},
	reviews: {
		select: returnReviewObject,
		orderBy: {
			createdAt: 'desc'
		}
	},
	productType: {
		select: {
			color: true,
			type: true,
			images: true
		}
	}
}

export const productReturnObjectFullest: Prisma.ProductSelect = {
	...productReturnObject
}
