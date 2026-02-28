# PriceHub — Product Price Aggregation API

A **NestJS** + **Prisma** (v6) + **PostgreSQL** service that aggregates pricing and availability data for digital products from multiple simulated external providers.

**Swagger API docs**: http://localhost:3000/api

## Table of Contents

- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [API Documentation](#api-documentation)
- [Design Decisions](#design-decisions)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Configuration](#configuration)

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                          NestJS Application                         │
│                                                                      │
│  ┌──────────────┐   ┌──────────────────┐   ┌──────────────────────┐ │
│  │  Simulated   │   │                  │   │                      │ │
│  │  Providers   │◄──│   Aggregation    │──►│   PostgreSQL (via    │ │
│  │  A, B, C     │   │   Service        │   │   Prisma ORM)        │ │
│  │  (in-memory) │   │   (Cron-based)   │   │                      │ │
│  └──────────────┘   └──────────────────┘   └──────────┬───────────┘ │
│                                                        │             │
│  ┌──────────────────┐   ┌─────────────────────────────┤             │
│  │  Products API    │◄──┤                             │             │
│  │  (REST + filters)│   │   Price History Tracking     │             │
│  └──────────────────┘   └─────────────────────────────┘             │
│                                                                      │
│  ┌──────────────────┐   ┌──────────────────┐                        │
│  │  SSE Events      │   │  Real-time HTML  │                        │
│  │  /events/products│──►│  Dashboard       │                        │
│  └──────────────────┘   └──────────────────┘                        │
└──────────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Providers** maintain in-memory product catalogues with different payload shapes. Prices and availability mutate every 5 seconds.
2. **Aggregation Service** polls all providers concurrently every 30s (configurable), normalizes the data, upserts into PostgreSQL, and records price history on change.
3. **Products API** serves the aggregated data with filtering, pagination, and change tracking.
4. **SSE stream** pushes live updates to a simple HTML dashboard.

---

## Quick Start

### Prerequisites

- **Node.js** ≥ 18
- **PostgreSQL** (or Docker)

### Option A: Docker Compose (recommended)

```bash
docker-compose up --build
```

This starts PostgreSQL (with healthcheck) + the app. The API will be available at:
- **App**: http://localhost:3000
- **Swagger**: http://localhost:3000/api
- **Dashboard**: http://localhost:3000

### Option B: Local Development

1. **Start PostgreSQL** (e.g., via Docker):
   ```bash
   docker run -d --name pricehub-db -p 5432:5432 \
     -e POSTGRES_USER=pricehub \
     -e POSTGRES_PASSWORD=pricehub \
     -e POSTGRES_DB=pricehub \
     postgres:16-alpine
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env if needed (defaults work with the Docker Postgres above)
   ```

4. **Run database migration:**
   ```bash
   npx prisma migrate dev --name init
   ```

5. **Start the dev server:**
   ```bash
   npm run start:dev
   ```

---

## API Documentation

**Swagger UI**: [http://localhost:3000/api](http://localhost:3000/api)

**Real-time Dashboard**: [http://localhost:3000/](http://localhost:3000/) (simple HTML with SSE)

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/products` | Paginated list with filters: `name`, `availability`, `minPrice`, `maxPrice`, `provider` |
| `GET` | `/products/:id` | Single product with full price history |
| `GET` | `/products/changes?since=ISO_DATE` | Products changed since a given time |
| `GET` | `/providers/a/products` | Simulated Provider A (standard flat) |
| `GET` | `/providers/b/products` | Simulated Provider B (nested payload) |
| `GET` | `/providers/c/products` | Simulated Provider C (alternative flat) |
| `GET` | `/events/products` | SSE stream of product updates |

### Example Requests

```bash
# List available products under $50 from provider-a
curl "http://localhost:3000/products?availability=true&maxPrice=50&provider=provider-a"

# Get product detail with price history
curl "http://localhost:3000/products/<uuid>"

# Products changed in the last hour
curl "http://localhost:3000/products/changes?since=2026-02-28T07:00:00Z"
```

---

## Design Decisions

### 1. Simulated Providers as In-App Endpoints
Rather than running separate processes, the three providers live inside the same NestJS app as controller endpoints. An `@Interval(5000)` periodically mutates prices and availability to simulate real-world changes. This simplifies setup while demonstrating the aggregation flow end-to-end.

### 2. Three Different Payload Shapes
- **Provider A**: Standard flat (`id`, `name`, `price`, `availability`, …)
- **Provider B**: Nested (`details.title`, `pricing.amount`, `inStock`, …)
- **Provider C**: Alternative naming (`sku`, `productName`, `cost`, `isAvailable`, …)

The `NormalizerService` maps each shape into a common `NormalizedProduct` interface before storage.

### 3. Concurrent Fetch with Retry
`ProviderClientService` fetches from all providers using `Promise.allSettled` (so one failure doesn't block others) with exponential-backoff retry (configurable attempts/delay).

### 4. Upsert with Change Detection
Products are upserted via a composite unique key `(externalId, provider)`. Before upserting, the service compares the existing price and availability to detect changes and creates `PriceHistory` records only when something actually changed.

### 5. Stale Data Mechanism
Products not fetched within a configurable threshold (`STALE_THRESHOLD_MS`, default 2 minutes) are marked `isStale = true`. This persists across restarts and is cleared on the next successful fetch.

### 6. Rate Limiting
`@nestjs/throttler` is applied globally (100 requests/minute by default) to protect the API surface.

### Trade-offs
- **Polling vs. Webhooks**: Polling simplifies the simulated setup; in production, webhooks or message queues would be preferable.
- **In-process providers**: Keeps the demo self-contained but wouldn't scale in production.
- **Single-process aggregation**: No distributed locking; in production, a job queue (e.g., BullMQ) would prevent duplicate work.

---

## Project Structure

```
src/
├── aggregation/          # Data aggregation from providers
│   ├── aggregation.module.ts
│   ├── aggregation.service.ts        # Cron-based orchestrator
│   ├── normalizer.service.ts         # Payload normalization
│   ├── provider-client.service.ts    # HTTP fetch with retry
│   └── interfaces/
│       └── normalized-product.interface.ts
├── events/               # SSE real-time stream
│   ├── events.controller.ts
│   └── events.module.ts
├── prisma/               # Database access
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── products/             # REST API
│   ├── dto/
│   │   ├── get-products-query.dto.ts
│   │   └── get-changes-query.dto.ts
│   ├── products.controller.ts
│   ├── products.module.ts
│   └── products.service.ts
├── providers/            # Simulated external APIs
│   ├── providers.controller.ts
│   ├── providers.module.ts
│   └── providers.service.ts
├── app.module.ts
└── main.ts
prisma/
└── schema.prisma
public/
└── index.html            # SSE-powered real-time dashboard
```

---

## Testing

```bash
# Unit tests
npm test

# E2E tests (requires running PostgreSQL)
npm run test:e2e

# Coverage report
npm run test:cov
```

Test coverage includes:
- **NormalizerService** — all 3 provider payload shapes
- **AggregationService** — upsert flow, price history creation, error resilience
- **ProductsService** — pagination, filtering, not-found handling
- **ProvidersService** — catalogue structure and mutation safety

---

## Configuration

All settings are in `.env` (see `.env.example`):

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | App port |
| `DATABASE_URL` | (see .env) | PostgreSQL connection string |
| `FETCH_INTERVAL_MS` | `30000` | How often to poll providers (ms) |
| `STALE_THRESHOLD_MS` | `120000` | Mark products stale after this (ms) |
| `MAX_RETRIES` | `3` | Retry attempts per provider |
| `RETRY_DELAY_MS` | `1000` | Base retry delay (exponential backoff) |
| `THROTTLE_TTL` | `60000` | Rate limit window (ms) |
| `THROTTLE_LIMIT` | `100` | Max requests per window |

---

## License

MIT