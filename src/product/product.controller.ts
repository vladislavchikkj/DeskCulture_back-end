import {
	BadRequestException,
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	Param,
	Post,
	Put,
	Query,
	UploadedFiles,
	UseInterceptors,
	UsePipes,
	ValidationPipe
} from '@nestjs/common'
import { FilesInterceptor } from '@nestjs/platform-express'
import { Auth } from 'src/auth/decorator/auth.decorator'
import { multerConfig } from 'src/multer-config'
import { GetAllProductDto } from './dto/get-all.product.dto'
import { ProductDto } from './dto/product.dto'
import { ProductService } from './product.service'

@Controller('products')
export class ProductController {
	constructor(private readonly productService: ProductService) {}

	@UsePipes(new ValidationPipe())
	@Get()
	async getAll(@Query() queryDto: GetAllProductDto) {
		return this.productService.getAll(queryDto)
	}

	@UsePipes(new ValidationPipe())
	@Get(':id')
	async getById(@Param('id') id: string) {
		return this.productService.byId(+id)
	}

	@Get('similar/:id')
	async getSimilar(@Param('id') id: string) {
		return this.productService.getSimilar(+id)
	}

	@Get('by-slug/:slug')
	async getProductBySlug(@Param('slug') slug: string) {
		return this.productService.bySlug(slug)
	}

	@Get('by-category/:categorySlug')
	async getProductByCategory(@Param('categorySlug') categorySlug: string) {
		return this.productService.byCategory(categorySlug)
	}
	@Get('by-setups/:id')
	async getProductbySetupsId(@Param('id') id: number) {
		return this.productService.bySetupsId(+id)
	}

	@UsePipes(new ValidationPipe())
	@HttpCode(200)
	@Auth('admin')
	@Post()
	@UseInterceptors(FilesInterceptor('images', 20, multerConfig)) // Позволяет загружать до 20 изображений
	async createProduct(
		@UploadedFiles() files: Express.Multer.File[],
		@Body() createProductDto: ProductDto
	) {
		if (!files || files.length === 0) {
			throw new BadRequestException('Images are required')
		}

		const parsedCategoryId = Number(createProductDto.categoryId)

		if (isNaN(parsedCategoryId)) {
			throw new BadRequestException('Category ID must be a number')
		}

		createProductDto.categoryId = parsedCategoryId

		return this.productService.create(createProductDto, files)
	}

	@UsePipes(new ValidationPipe())
	@HttpCode(200)
	@Put(':id')
	@Auth('admin')
	async updateProduct(@Param('id') id: string, @Body() dto: ProductDto) {
		return this.productService.update(+id, dto)
	}

	@HttpCode(200)
	@Delete(':id')
	@Auth('admin')
	async deleteProduct(@Param('id') id: string) {
		return this.productService.delete(+id)
	}
}
