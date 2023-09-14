import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { Request, json } from 'express'
import { AppModule } from './app.module'
import { PrismaService } from './prisma.service'

async function bootstrap() {
	const app = await NestFactory.create(AppModule)

	// Middleware, сохраняющий `rawBody` наряду с обычным `body`.
	app.use((req: Request, res, next) => {
		// @ts-ignore
		req.rawBody = ''
		// @ts-ignore
		req.on('data', chunk => (req.rawBody += chunk))
		next()
	})
	app.use(json())

	// Документация Swagger
	const config = new DocumentBuilder()
		.setTitle('Cats example')
		.setDescription('The cats API description')
		.setVersion('1.0')
		.addTag('cats')
		.addBearerAuth()
		.build()
	const document = SwaggerModule.createDocument(app, config)
	SwaggerModule.setup('test', app, document)

	const prismaService = app.get(PrismaService)
	await prismaService.enableShutdownHooks(app)

	app.setGlobalPrefix('api')
	app.enableCors()

	await app.listen(4200)
}
bootstrap()
