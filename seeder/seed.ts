import { faker } from '@faker-js/faker'
import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'

dotenv.config()
const prisma = new PrismaClient()

const createProducts = async (quantity: number) => {
	const products = []

	for (let i = 0; i < quantity; i++) {
		const productName = faker.commerce.productName()
		const productSlug = faker.helpers.slugify(productName).toLocaleLowerCase()
		const categoryName = faker.commerce.department()
		const categorySlug = faker.helpers.slugify(categoryName).toLocaleLowerCase()

		const product = await prisma.product.create({
			data: {
				name: productName,
				slug: productSlug,
				description: faker.commerce.productDescription(),
				price: +faker.commerce.price({ min: 10, max: 999 }),
				images: Array.from({
					length: faker.number.int({ min: 2, max: 6 })
				}).map(() => faker.image.url()),
				category: {
					create: {
						name: categoryName,
						slug: categorySlug
					}
				},
				reviews: {
					create: [
						{
							rating: faker.number.int({ min: 1, max: 5 }),
							text: faker.lorem.paragraph(),
							user: {
								connect: {
									id: 1
								}
							}
						},
						{
							rating: faker.number.int({ min: 1, max: 5 }),
							text: faker.lorem.paragraph(),
							user: {
								connect: {
									id: 1
								}
							}
						}
					]
				}
			}
		})

		products.push(product)
	}

	console.log(`Создано ${products.length} продуктов`)
}

async function main() {
	console.log('Начало заполнения базы данных ...')
	await createProducts(10)
}

main()
	.catch(e => console.error(e))
	.finally(async () => {
		await prisma.$disconnect()
	})
