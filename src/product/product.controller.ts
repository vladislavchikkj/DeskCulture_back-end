import {
	BadRequestException,
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	Param,
	ParseIntPipe,
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
import { ColorVariantDto } from './dto/color-variant.dto'
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
	async getProductbySetupsId(@Param('id', new ParseIntPipe()) id: number) {
		return this.productService.bySetupsId(id)
	}

	// Create product

	@UsePipes(new ValidationPipe())
	@HttpCode(200)
	@Auth('admin')
	@Post()
	@UseInterceptors(FilesInterceptor('image', 10, multerConfig))
	async createProduct(
		@UploadedFiles() files,
		@Body() dto: Omit<ProductDto, 'images'>
	) {
		if (!files || files.length === 0) {
			throw new BadRequestException('At least one image must be uploaded.')
		}
		return this.productService.create(dto, files)
	}

	// Update product

	@UsePipes(new ValidationPipe())
	@Put(':id')
	@Auth('admin')
	@UseInterceptors(FilesInterceptor('image', 10, multerConfig))
	async updateProduct(
		@Param('id', ParseIntPipe) id: number,
		@Body() dto: Omit<ProductDto, 'images'>,
		@UploadedFiles() files
	) {
		if (!files || files.length === 0) {
			throw new BadRequestException('At least one image must be uploaded.')
		}
		return this.productService.update(id, dto, files)
	}

	// Delete product

	@HttpCode(200)
	@Delete(':id')
	@Auth('admin')
	async deleteProduct(@Param('id', ParseIntPipe) id: number) {
		return this.productService.delete(id)
	}

	// Color variants

	// Create color variants

	@UsePipes(new ValidationPipe())
	@HttpCode(200)
	@Auth('admin')
	@Post(':productId/color-variants')
	@UseInterceptors(FilesInterceptor('colorVariantImage', 10, multerConfig))
	async createColorVariant(
		@Param('productId', ParseIntPipe) productId: number,
		@Body() dto: ColorVariantDto,
		@UploadedFiles() files
	) {
		if (!files || files.length === 0) {
			throw new BadRequestException('At least one image must be uploaded.')
		}
		return this.productService.createColorVariant(productId, dto, files)
	}

	// Update color variants

	@UsePipes(new ValidationPipe())
	@Put(':productId/color-variants/:colorVariantId')
	@Auth('admin')
	@UseInterceptors(FilesInterceptor('colorVariantImage', 10, multerConfig))
	async updateColorVariant(
		@Param('productId', ParseIntPipe) productId: number,
		@Param('colorVariantId', ParseIntPipe) colorVariantId: number,
		@Body() dto: ColorVariantDto,
		@UploadedFiles() files
	) {
		if (!files || files.length === 0) {
			throw new BadRequestException('At least one image must be uploaded.')
		}
		return this.productService.updateColorVariant(
			productId,
			colorVariantId,
			dto,
			files
		)
	}

	// Update color variants name

	@Put(':productId/color-variants/:colorVariantId/name')
	@Auth('admin')
	async updateColorVariantName(
		@Param('productId', ParseIntPipe) productId: number,
		@Param('colorVariantId', ParseIntPipe) colorVariantId: number,
		@Body() dto: Pick<ColorVariantDto, 'color'>
	) {
		return this.productService.updateColorVariantName(
			productId,
			colorVariantId,
			dto
		)
	}

	// Update color variants images

	@Put(':productId/color-variants/:colorVariantId/images')
	@Auth('admin')
	@UseInterceptors(FilesInterceptor('colorVariantImage', 10, multerConfig))
	async updateColorVariantImages(
		@Param('productId', ParseIntPipe) productId: number,
		@Param('colorVariantId', ParseIntPipe) colorVariantId: number,
		@UploadedFiles() files
	) {
		if (!files || files.length === 0) {
			throw new BadRequestException('At least one image must be uploaded.')
		}
		return this.productService.updateColorVariantImages(
			productId,
			colorVariantId,
			files
		)
	}

	// Delete color variants images

	@HttpCode(200)
	@Delete(':productId/color-variants/:colorVariantId')
	@Auth('admin')
	async deleteColorVariant(
		@Param('productId', ParseIntPipe) productId: number,
		@Param('colorVariantId', ParseIntPipe) colorVariantId: number
	) {
		return this.productService.deleteColorVariant(productId, colorVariantId)
	}
}
