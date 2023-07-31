import { Module } from '@nestjs/common'
import { PrismaService } from 'src/prisma.service'
import { SetupsController } from './setups.controller'
import { SetupsService } from './setups.service'

@Module({
	controllers: [SetupsController],
	providers: [SetupsService, PrismaService]
})
export class SetupsModule {}
