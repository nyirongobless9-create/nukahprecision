# NUKAH PRECISION WORKS LIMITED - Online Shop

A deployable Node.js shop with a responsive storefront, illustrated catalogue, cart, persistent order database, customer order tracking and password-protected admin area.

## What works
- Customer browsing, filtering, cart, checkout and server-side order records.
- Product prices in **MWK**, stock checks and inventory reduction on order placement.
- Admin dashboard for product prices, stock, visibility, adding products, order review and status updates.
- Customer order-status lookup using reference and email.
- Collection, plus optional **manual** bank transfer, Airtel Money and TNM Mpamba instructions when configured.
- Local SQLite persistence (keep `DB_PATH` on a persistent disk when hosting).

## Important payment limitation
This package **does not process or verify electronic payments**. It records orders and shows your verified payment instructions. A staff member must independently verify any transfer and change the order status to paid. Never mark an order paid based only on a customer-entered reference. For automatic Airtel Money/Mpamba/bank-card payment confirmation, a contracted gateway account, credentials, webhook implementation and live transaction testing are required.

## Requirements and first run
1. Install **Node.js 22.13+**.
2. Copy `.env.example` values into your host's environment settings. For local development, export the variables in your shell; this app does not automatically read `.env` files.
3. Set a long unique `ADMIN_PASSWORD` and a random `SESSION_SECRET` (at least 32 random bytes). Without a password the admin login is disabled.
4. Run `npm start`, then visit `http://localhost:3000` and `http://localhost:3000/admin.html`.
5. Sign in to the admin area and set actual product prices. All initial prices are deliberately blank to avoid publishing invented prices. Unpriced products display "Price on request" and cannot be purchased in checkout.
6. Add confirmed phone/email/location and verified payment instructions in your environment settings, restart the server.
7. Configure HTTPS and a persistent database volume on your hosting provider, back up the database, and test a real order before sharing the live link.

### Environment configuration
- `PORT`: HTTP port, default 3000
- `PUBLIC_URL`: live HTTPS site URL (enables Secure session cookie)
- `ADMIN_PASSWORD`: staff login password (required)
- `SESSION_SECRET`: random session-signing key (required for sessions to survive restarts)
- `DB_PATH`: absolute path to persistent SQLite database, default `./data/shop.sqlite`
- `SHOP_PHONE`, `SHOP_EMAIL`, `SHOP_LOCATION`: public business contact information
- `BANK_PAYMENT_INSTRUCTIONS`, `AIRTEL_PAYMENT_INSTRUCTIONS`, `MPAMBA_PAYMENT_INSTRUCTIONS`: manually verified payment instructions. A method only appears when its instructions are nonempty.

## Operational checklist before launch
- Confirm registration, address, business phone and business email.
- Enter verified prices, stock, fulfilment lead times and delivery policy.
- Confirm mobile money merchant/business numbers and bank account with the business owner.
- Decide how staff will be notified of new orders (admin currently needs manual refresh).
- Publish privacy, refunds, returns and terms appropriate to your business and Malawi law.
- Test order placement, payment reconciliation, inventory and backups.
- Add automated email/SMS and payment gateway integration if required.

## Notes on security and deployment
This is a functional **starter shop**, not a certified payment platform. It includes prepared SQL statements, server-side price validation, same-origin checks, rate limits, HttpOnly admin session cookies and a content security policy. Use HTTPS, secure environment secrets, persistent backups, server monitoring and further security review before handling high volumes of real customer orders. Do not use the default SQLite file on an ephemeral host or your orders may disappear on restart.

## Running tests
`npm test`

## Docker deployment
With Docker installed, set the environment variables from `.env.example` in your deployment system or a private local `.env` file, then run `docker compose up -d --build`. The compose file uses a persistent `shop_data` volume. Put the service behind an HTTPS reverse proxy and set `PUBLIC_URL` to the actual public HTTPS URL. The example Docker configuration does not set up a domain, TLS certificate or backups for you.
