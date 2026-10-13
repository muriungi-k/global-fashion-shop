# Global Fashion Shop

A full-stack fashion store built with React, Vinext, and Cloudflare D1. The UI follows the five provided design references: editorial home, minimal shop, rounded commerce pages, dark authentication, and a red-accented admin dashboard.

## Pages

Home; Shop; Collections and category pages; New Arrivals; Sale; Product Details; Search; Wishlist; Cart; Checkout; Order Confirmation; Login; Signup; Forgot Password; Account; Orders; Order Details and Tracking; About; Contact; FAQ; Shipping & Returns; Size Guide; Privacy; Terms; Admin.

## Features

Category, colour, and price filtering; sorting; size and quantity selection; browser-persisted bag and wishlist; WELCOME10 discount; account registration and login; salted PBKDF2 password hashes; HTTP-only expiring sessions; server-calculated totals; cash-on-delivery orders; transactionally checked and decremented inventory; customer-specific order access; contact and newsletter records; protected admin product editing, order status changes, customer lists, and inbox.

## Local preview on this Mac

Run `node scripts/preview.mjs`. This builds the browser client and serves the same store UI and API at http://127.0.0.1:5173 using a local SQLite database. Set ADMIN_PASSWORD in your environment or supply the hidden stdin configuration requested by the script. Runtime files and the local database are ignored under `.local-preview/`. The hosted version uses D1.

## Runtime

Node 22.13+ and a supported Cloudflare Workers runtime (macOS 13.5+ or supported Linux). This workspace's macOS 11.6 cannot run the Cloudflare preview runtime, though type checks and production compilation can run.

```sh
npm run install:ci
npm run db:generate
npm run build
# Apply generated SQL to local D1 before a local preview:
node --import ./scripts/sites-env.mjs node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_young_jack_power.sql
npm run dev
```

Set ADMIN_PASSWORD as a secret runtime variable to enable administrator sign-in at `/admin`. Never put this value in source files. Hosted D1 migrations are applied by Sites at deployment.

## Launch content and integrations

Product records and AI-edited imagery are illustrative. The 20 unique photographs were edited with the built-in image_gen tool and are stored locally as optimized WebP files under public/images/ai/. The full prompt set is in design-system/global-fashion/image-prompts.md. The provided images are layout references, not a set of individual source product photos. Replace catalogue imagery, material descriptions, size information, stock, merchant identity, and provisional policies before selling actual inventory.

Currency is USD; shipping is $8 and free at $150. Cash on delivery is the only payment method, and no payment card information is collected. Real card or mobile-money payments require a merchant payment-provider integration. Newsletter and contact forms save records to the admin inbox; outgoing email is not configured. Password reset requests are recorded for support review, not automatically emailed. Bag and wishlist are local to the current browser.

Apply both generated migrations when setting up local D1: `0000_young_jack_power.sql` and `0001_spooky_enchantress.sql`.

`node scripts/test-store.mjs` runs meaningful API integration tests against SQLite with the D1 contract emulated, without starting the native Cloudflare runtime. `node scripts/check-pages.mjs` server-renders representative page layouts and checks navigation and accessible control names. These do not replace browser QA.

## Kids and Unisex collections

Kids has separate Boys and Girls pages, shared kids essentials, age sizes from 2–3Y to 10–11Y, and an editable audience field in admin. Unisex contains clothing only. Shoes, hats, sunglasses and bags stay in their respective product categories. Four new AI-generated kids garment photographs are stored under public/images/ai/; prompts are recorded in design-system/global-fashion/kids-image-prompts.md. New product records remain sample launch inventory.
