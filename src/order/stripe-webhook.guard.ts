// stripe-webhook.guard.ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Request } from 'express'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.SECRET_KEY, {
	apiVersion: '2023-08-16'
})

@Injectable()
export class StripeWebhookGuard implements CanActivate {
	async canActivate(context: ExecutionContext): Promise<boolean> {
		const req = context.switchToHttp().getRequest<Request>()
		try {
			const signature = req.headers['stripe-signature']
			const event = stripe.webhooks.constructEvent(
				// @ts-ignore
				req.rawBody,
				signature,
				process.env.STRIPE_WEBHOOK_SECRET
			)
			req.body = event
			console.log('Stripe webhook guard called:', event.type)
			return true
		} catch (err) {
			console.error(
				'⚠️  Error while validating Stripe webhook signature:',
				err.message
			)
			return false
		}
	}
}
