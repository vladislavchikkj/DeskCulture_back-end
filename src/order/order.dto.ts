import { EnumOrderStatus } from '@prisma/client'
import { Type } from 'class-transformer'
import {
	IsArray,
	IsEnum,
	IsNumber,
	IsOptional,
	IsString,
	ValidateNested
} from 'class-validator'

export class OrderDto {
	@IsOptional()
	@IsEnum(EnumOrderStatus)
	status: EnumOrderStatus

	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => OrderItemDto)
	items: OrderItemDto[]

	@IsString()
	firstName: string

	@IsString()
	lastName: string

	@IsString()
	country: string

	@IsString()
	state: string

	@IsString()
	city: string

	@IsString()
	postCode: string

	@IsString()
	street: string

	@IsString()
	house: string

	@IsString()
	phoneCode: string

	@IsString()
	phone: string

	@IsString()
	email: string
}

export class OrderItemDto {
	@IsNumber()
	quantity: number

	@IsNumber()
	price: number

	@IsNumber()
	productId: number

	@IsOptional()
	@IsString()
	type: string

	@IsOptional()
	@IsString()
	color: string
}
