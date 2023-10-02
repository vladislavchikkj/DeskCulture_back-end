import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	Param,
	ParseIntPipe,
	Post,
	Put,
	UploadedFile,
	UseInterceptors,
	UsePipes,
	ValidationPipe
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { Product } from '@prisma/client'
import { Auth } from 'src/auth/decorator/auth.decorator'
import { multerConfig } from 'src/multer-config'
import { SetupsDto } from './setups.dto'
import { SetupsService } from './setups.service'

@Controller('setups')
export class SetupsController {
	constructor(private readonly setupsService: SetupsService) {}

	@Get()
	async getAll() {
		return this.setupsService.getAll()
	}
	@Get(':id')
	async getById(@Param('id') id: string) {
		return this.setupsService.byId(+id)
	}

	@UsePipes(new ValidationPipe())
	@HttpCode(200)
	@Auth('admin')
	@Post()
	@UseInterceptors(FileInterceptor('image', multerConfig))
	async create(@UploadedFile() file, @Body() dto: Omit<SetupsDto, 'images'>) {
		return this.setupsService.create(dto, file)
	}

	@UsePipes(new ValidationPipe())
	@Put(':id')
	@Auth('admin')
	@UseInterceptors(FileInterceptor('image', multerConfig))
	async update(
		@Param('id', ParseIntPipe) id: number,
		@Body() dto: Omit<SetupsDto, 'images'>,
		@UploadedFile() file
	) {
		return this.setupsService.update(id, dto, file)
	}

	@HttpCode(200)
	@Auth()
	@Delete(':id')
	async delete(@Param('id') id: string) {
		return this.setupsService.delete(+id)
	}
	@Post(':setupId/addProduct/:productId')
	async addProductToSetup(
		@Param('setupId') setupId: string,
		@Param('productId') productId: string
	) {
		return this.setupsService.addProductToSetup(+setupId, +productId)
	}

	@Get(':setupId/products')
	async getProductsInSetup(
		@Param('setupId') setupId: string
	): Promise<Product[]> {
		return this.setupsService.getProductsInSetup(+setupId)
	}
}
