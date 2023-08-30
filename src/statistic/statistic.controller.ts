import { Controller, Get } from '@nestjs/common'
import { Auth } from 'src/auth/decorator/auth.decorator'
import { CurrentUser } from 'src/auth/decorator/user.decorator'
import { StatisticService } from './statistic.service'

@Controller('statistics')
export class StatisticController {
	constructor(private readonly statisticService: StatisticService) {}

	@Get('main')
	@Auth('admin')
	getMainStatistics() {
		return this.statisticService.getMain()
	}
}
