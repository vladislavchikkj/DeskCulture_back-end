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
import {
	FileFieldsInterceptor,
	FilesInterceptor
} from '@nestjs/platform-express'
import { Auth } from 'src/auth/decorator/auth.decorator'
import { multerConfig } from 'src/multer-config'
import { GetAllProductDto } from './dto/get-all.product.dto'
import { ProductTypeDto } from './dto/product-types.dto'
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
	@UseInterceptors(
		FileFieldsInterceptor(
			[
				{ name: 'images', maxCount: 10 },
				{ name: 'imagesInfo', maxCount: 10 }
			],
			multerConfig
		)
	)
	async createProduct(
		@UploadedFiles() files,
		@Body() dto: Omit<ProductDto, 'images' | 'imagesInfo'>
	) {
		if (
			!files ||
			!files.images ||
			files.images.length === 0 ||
			!files.imagesInfo ||
			files.imagesInfo.length === 0
		) {
			throw new BadRequestException(
				'At least one image and one info image must be uploaded.'
			)
		}
		return this.productService.create(dto, files.images, files.imagesInfo)
	}

	// Update product

	@Put(':id')
	@UseInterceptors(
		FileFieldsInterceptor(
			[
				{ name: 'images', maxCount: 10 },
				{ name: 'imagesInfo', maxCount: 10 }
			],
			multerConfig
		)
	)
	async updateProduct(
		@Param('id', ParseIntPipe) id: number,
		@Body() dto: Omit<ProductDto, 'images' | 'imagesInfo'>,
		@UploadedFiles() files
	) {
		if (!files || files.images.length === 0 || files.imagesInfo.length === 0) {
			throw new BadRequestException(
				'At least one image and one info image must be uploaded.'
			)
		}
		return this.productService.update(id, dto, files.images, files.imagesInfo)
	}

	// Delete product

	@HttpCode(200)
	@Delete(':id')
	@Auth('admin')
	async deleteProduct(@Param('id', ParseIntPipe) id: number) {
		return this.productService.delete(id)
	}

	// productType

	// Create productType

	@UsePipes(new ValidationPipe())
	@HttpCode(200)
	@Auth('admin')
	@Post(':productId/product-type')
	@UseInterceptors(FilesInterceptor('productTypeImage', 10, multerConfig))
	async createProductType(
		@Param('productId', ParseIntPipe) productId: number,
		@Body() dto: ProductTypeDto,
		@UploadedFiles() files
	) {
		if (!files || files.length === 0) {
			throw new BadRequestException('At least one image must be uploaded.')
		}
		return this.productService.createProductType(productId, dto, files)
	}

	// Update color variants

	@UsePipes(new ValidationPipe())
	@Put(':productId/product-type/:productTypeId')
	@Auth('admin')
	@UseInterceptors(FilesInterceptor('productTypeImage', 10, multerConfig))
	async updateColorVariant(
		@Param('productId', ParseIntPipe) productId: number,
		@Param('productTypeId', ParseIntPipe) productTypeId: number,
		@Body() dto: ProductTypeDto,
		@UploadedFiles() files
	) {
		if (!files || files.length === 0) {
			throw new BadRequestException('At least one image must be uploaded.')
		}
		return this.productService.updateProductType(
			productId,
			productTypeId,
			dto,
			files
		)
	}

	// Update color variants name

	@Put(':productId/productType/:productTypeId/name')
	@Auth('admin')
	async updateColorVariantName(
		@Param('productId', ParseIntPipe) productId: number,
		@Param('productTypeId', ParseIntPipe) productTypeId: number,
		@Body() dto: Pick<ProductTypeDto, 'color'>
	) {
		return this.productService.updateProductTypeName(
			productId,
			productTypeId,
			dto
		)
	}

	// Update color variants images

	@Put(':productId/productType/:productTypeId/images')
	@Auth('admin')
	@UseInterceptors(FilesInterceptor('productTypeImage', 10, multerConfig))
	async updateProductTypeImages(
		@Param('productId', ParseIntPipe) productId: number,
		@Param('productTypeId', ParseIntPipe) productTypeId: number,
		@UploadedFiles() files
	) {
		if (!files || files.length === 0) {
			throw new BadRequestException('At least one image must be uploaded.')
		}
		return this.productService.updateProductTypeImages(
			productId,
			productTypeId,
			files
		)
	}

	// Delete color variants images

	@HttpCode(200)
	@Delete(':productId/productType/:productTypeId')
	@Auth('admin')
	async deleteColorVariant(
		@Param('productId', ParseIntPipe) productId: number,
		@Param('productTypeId', ParseIntPipe) productTypeId: number
	) {
		return this.productService.deleteProductType(productId, productTypeId)
	}
}
