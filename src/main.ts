import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { json } from 'express'
import { AppModule } from './app.module'
import { PrismaService } from './prisma.service'

function saveRawBody(req, _, buf, encoding) {
	if (buf && buf.length) {
		req.rawBody = buf.toString(encoding || 'utf8')
	}
}

async function bootstrap() {
	const app = await NestFactory.create(AppModule)
	app.enableCors()

	// Middleware, сохраняющий `rawBody` наряду с обычным `body`.
	app.use((req, res, next) => {
		if (
			req.headers['content-type'] &&
			req.headers['content-type'].includes('multipart/form-data')
		) {
			next()
		} else {
			req.rawBody = ''
			req.on('data', chunk => (req.rawBody += chunk))
			next()
		}
	})

	app.use(json({ verify: saveRawBody }))

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
