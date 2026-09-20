import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '')

export function stripeIsConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY)
}
