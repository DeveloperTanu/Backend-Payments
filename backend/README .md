# Backend

This folder contains the server-side code for the application. The backend handles API requests, checks authentication, works with the database, and connects to external services such as Stripe.

The main goal of this structure is to keep each part of the application focused on one responsibility. That makes the code easier to understand, test, and maintain as the project grows.

## Folder structure

```text
server/
├── config/
│   └── stripe.js
├── controllers/
│   └── payment.controller.js
├── middlewares/
│   └── auth.middleware.js
├── models/
│   ├── user.model.js
│   └── plan.model.js
├── routes/
│   └── payment.routes.js
├── services/
│   └── stripe.service.js
├── webhooks/
│   └── stripe.webhook.js
├── app.js
└── server.js
```

The exact files may change as the application develops. Each folder has a specific purpose.

## What each folder does

### `config/`

This folder contains configuration for services the backend uses.

- `stripe.js` creates and exports the Stripe client using the secret API key from environment variables.
- Keeping the setup in one place means other files can import the configured client instead of initializing it repeatedly.

### `controllers/`

Controllers handle incoming HTTP requests and decide what response to send.

For example, `payment.controller.js` receives a checkout request, calls the payment service, and returns the Checkout Session URL to the frontend. It should handle the HTTP layer rather than contain all the payment logic itself.

### `middlewares/`

Middleware runs between receiving a request and reaching the controller.

For example, `auth.middleware.js` can verify the user's authentication token, look up the user, and attach the user document to `req.user`. If authentication fails, it returns an error and stops the request from continuing.

Middleware is useful for checks that need to happen before a controller runs, such as authentication, validation, or role checks.

### `models/`

Models define the shape of data stored in MongoDB.

- `user.model.js` defines the user document.
- `plan.model.js` can define available plans, including their names, identifiers, prices, and currency.

The backend should use trusted server-side plan data when deciding how much to charge. It should not blindly accept a price sent by the frontend.

### `routes/`

Routes connect HTTP methods and URLs to middleware and controllers.

For example, `payment.routes.js` can define a `POST /checkout` route that first runs the authentication middleware and then calls the checkout controller. When mounted at `/api/payment`, the full endpoint becomes:

```text
POST /api/payment/checkout
```

### `services/`

Services contain operations and business logic that can be called by controllers or other parts of the backend.

For payments, `stripe.service.js` communicates with Stripe's API to create a Checkout Session. Keeping this work in a service helps avoid putting Stripe-specific details directly into the controller.

### `webhooks/`

Webhooks handle event notifications sent by an external service to the backend.

For payments, `stripe.webhook.js` can receive Stripe events and process them after verifying the event signature. This is how the backend can confirm payment outcomes and update the user's payment or access status without relying on the customer reaching a success page.

Stripe webhook routes need the raw request body for signature verification. Configure the raw-body middleware for that route before a JSON parser consumes the body.

### `app.js` and `server.js`

These files set up and start the Express application.

- `app.js` creates the Express app, registers middleware, and mounts routes.
- `server.js` starts the HTTP server and can handle startup tasks such as connecting to the database.

Some projects combine these responsibilities in one file. Keeping them separate is a convention, not a requirement.

## How payment works in the backend

The payment flow has two parts: creating the checkout session and handling the result.

### 1. The customer starts checkout

The frontend sends a request to the backend, such as:

```text
POST /api/payment/checkout
```

The request should be authenticated so the backend knows which user is starting checkout.

### 2. The route checks authentication

The payment route runs `auth.middleware.js` before the controller. If the user is not authenticated, the request stops there.

If authentication succeeds, the middleware attaches the user to `req.user`.

### 3. The controller calls the payment service

The controller passes the relevant user and plan information to `stripe.service.js`. It then returns the Checkout Session URL to the frontend.

### 4. The service creates a Stripe Checkout Session

The payment service uses the Stripe client from `config/stripe.js` to create a Checkout Session. The session contains details such as the payment mode, line items, and success and cancellation URLs.

The backend must determine the price from trusted data, such as a database plan or a Stripe Price ID. The Stripe secret key must remain on the server and must never be exposed to frontend code.

### 5. The frontend redirects the customer to Stripe

The frontend uses the URL returned by the backend to send the customer to Stripe Checkout, where they enter their payment details.

### 6. Stripe sends a webhook event

After checkout, Stripe sends an event to the backend's webhook endpoint. The webhook handler verifies the signature using the webhook signing secret and checks the event type and payment status.

Only after verifying the relevant payment event should the backend grant paid access or update the order or payment record. A success page alone is not proof that a payment succeeded.

Webhook handling should be idempotent: if Stripe retries the same event, the backend should not grant access or fulfil the order twice.

## Environment variables

Store secret values in environment variables rather than hard-coding them in source files. A local `.env` file might contain:

```env
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_signing_secret
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your_jwt_secret
```

Use the correct frontend URL for your environment. Do not commit real secrets or your `.env` file to version control. Add `.env` to `.gitignore`.

`STRIPE_SECRET_KEY` authenticates server-side requests to Stripe. `STRIPE_WEBHOOK_SECRET` is used to verify webhook signatures; these are different values.

## A few things to keep in mind

- Authentication confirms who is making a request; authorization determines what that user is allowed to do.
- Keep payment logic on the backend. Never trust a frontend-provided amount as the source of truth.
- Verify webhook signatures before acting on webhook events.
- Do not grant paid access just because the customer lands on a success URL.
- Handle repeated webhook events safely.
- Return useful HTTP status codes and avoid sending internal errors or secret values to the client.

This structure is intended to make the backend easier to follow: routes direct requests, middleware performs checks, controllers handle HTTP, services perform operations, models represent stored data, and webhooks process payment events sent by Stripe.
