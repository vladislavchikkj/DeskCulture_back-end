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
import { Auth } from 'src/auth/decorator/auth.decorator'
import { multerConfig } from 'src/multer-config'
import { CategoryDto } from './category.dto'
import { CategoryService } from './category.service'

@Controller('categories')
export class CategoryController {
	constructor(private readonly categoryService: CategoryService) {}

	@Get()
	async getAll() {
		return this.categoryService.getAll()
	}
	@Get('by-slug/:slug')
	async getBySlug(@Param('slug') slug: string) {
		return this.categoryService.bySlug(slug)
	}
	@Get(':id')
	@Auth()
	async getById(@Param('id') id: string) {
		return this.categoryService.byId(+id)
	}

	@UsePipes(new ValidationPipe())
	@HttpCode(200)
	@Auth('admin')
	@Post()
	@UseInterceptors(FileInterceptor('image', multerConfig))
	async create(@UploadedFile() file, @Body() dto: Omit<CategoryDto, 'images'>) {
		return this.categoryService.create(dto, file)
	}

	@UsePipes(new ValidationPipe())
	@Put(':id')
	@Auth('admin')
	@UseInterceptors(FileInterceptor('image', multerConfig))
	async update(
		@Param('id', ParseIntPipe) id: number,
		@Body() dto: Omit<CategoryDto, 'images'>,
		@UploadedFile() file
	) {
		return this.categoryService.update(id, dto, file)
	}

	@HttpCode(200)
	@Auth('admin')
	@Delete(':id')
	async delete(@Param('id') id: string) {
		return this.categoryService.delete(+id)
	}
}
