import {
	IsInt,
	IsNotEmpty,
	IsOptional,
	IsString,
	Max,
	Min
} from 'class-validator'

export class ReviewDto {
	@IsInt()
	@IsNotEmpty()
	@Min(1)
	@Max(5)
	rating: number

	@IsString()
	text: string

	@IsString()
	@IsOptional()
	imageUrl?: string
}
