import { faker } from '@faker-js/faker'
import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'

dotenv.config()
const prisma = new PrismaClient()

const createProducts = async (quantity: number) => {
	const products = []

	for (let i = 0; i < quantity; i++) {
		// Генерируем случайное имя продукта и формируем его slug
		const productName = faker.commerce.productName()
		const productSlug = faker.helpers.slugify(productName).toLocaleLowerCase()

		// Генерируем случайное имя категории и формируем ее slug
		const categoryName = faker.commerce.department()
		const categorySlug = faker.helpers.slugify(categoryName).toLocaleLowerCase()
		const categoriesImage = faker.image.imageUrl(200, 200, 'cat') // Замените 'abstract' на нужную категорию

		// Генерируем случайное имя настройки и формируем ее изображение
		const setupName = faker.commerce.department()
		const setupImage = faker.image.imageUrl(200, 200, 'abstract')

		// Создаем продукт с помощью Prisma
		const product = await prisma.product.create({
			data: {
				name: productName,
				slug: productSlug,
				description: faker.commerce.productDescription(),
				price: +faker.commerce.price({ min: 10, max: 999 }),

				// Добавляем настройку к продукту, включая имя, изображение и описание
				setups: {
					create: {
						name: setupName,
						image: setupImage,
						description: faker.lorem.paragraph()
					}
				},

				// Генерируем случайные изображения продукта
				images: Array.from({
					length: faker.number.int({ min: 2, max: 6 })
				}).map(() => faker.image.urlLoremFlickr()),

				// Добавляем категорию продукта с помощью Prisma
				category: {
					create: {
						name: categoryName,
						slug: categorySlug,
						image: categoriesImage,
						description: faker.lorem.paragraph()
					}
				},

				// Создаем два отзыва для продукта с помощью Prisma
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
