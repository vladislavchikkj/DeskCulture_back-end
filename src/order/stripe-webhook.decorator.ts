import { applyDecorators, UseGuards } from '@nestjs/common'
import { StripeWebhookGuard } from './stripe-webhook.guard'

export function StripeWebhook(): MethodDecorator {
	return applyDecorators(UseGuards(StripeWebhookGuard))
}
