---
name: ck:payment-integration
description: "Payment flows: Stripe, PayPal, MoMo, VNPay"
auto_load: false
triggers:
  - stripe
  - paypal
  - momo
  - vnpay
  - checkout
  - subscription
  - thanh toán
  - payment
  - billing
non_triggers:
  - deploy only
  - ui design only
  - database schema only
examples:
  - "add Stripe checkout flow cho monthly subscriptions"
  - "tích hợp thanh toán MoMo"
  - "setup recurring billing với Stripe"
metadata:
  author: forgekit
  version: "1.0.0"
---

# Payment Integration

Payment integration patterns — Stripe, PayPal, MoMo, VNPay. Chỉ hướng dẫn, không bundle SDK.

## Khi nào load

- User yêu cầu payment/checkout/subscription
- Cần tích hợp Stripe/PayPal/MoMo/VNPay
- Webhook handling cho payment events
- Subscription/recurring billing

## Không dùng khi

- Chỉ cần UI payment form (→ frontend-development)
- Chỉ cần deploy payment service (→ deploy)

## Stripe Pattern (Primary)

### Checkout Session
1. Frontend gọi API tạo Checkout Session
2. Server tạo session với `stripe.checkout.sessions.create()`
3. Redirect user tới session URL
4. Webhook nhận `checkout.session.completed`
5. Update DB order status

### Subscription Flow
1. Tạo Product + Price trong Stripe Dashboard
2. Checkout Session với `mode: 'subscription'`
3. Webhook: `customer.subscription.created/updated/deleted`
4. Portal cho user manage subscription

### Webhook Security
- Verify signature: `stripe.webhooks.constructEvent()`
- Idempotency: check event ID trước khi process
- Return 200 nhanh, process async

## VNPay / MoMo Pattern

1. Build payment URL với merchant config từ env
2. Redirect user tới payment gateway
3. Return URL: verify checksum/signature
4. IPN (Instant Payment Notification): update DB

## Security Rules

- API keys chỉ qua env vars (STRIPE_SECRET_KEY, etc.)
- Webhook secrets: verify mọi incoming request
- Không log full card numbers
- Test mode cho development (Stripe test keys)
- Amount calculation: luôn dùng integer (cents/vnd), không float

## Integration

- `auth` — user authentication trước payment
- `backend-development` — API endpoint cho payment
- `security-scan` — audit payment flow
