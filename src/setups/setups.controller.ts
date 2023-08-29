import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	Param,
	Post,
	Put,
	UsePipes,
	ValidationPipe
} from '@nestjs/common'
import { Product } from '@prisma/client'
import { Auth } from 'src/auth/decorator/auth.decorator'
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

	@HttpCode(200)
	@Auth()
	@Post()
	async create() {
		return this.setupsService.create()
	}

	@UsePipes(new ValidationPipe())
	@Auth()
	@HttpCode(200)
	@Put(':id')
	async update(@Param('id') id: string, @Body() dto: SetupsDto) {
		return this.setupsService.update(+id, dto)
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
