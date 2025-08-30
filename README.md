# OpenStays API

A high-performance, read-heavy REST API for property listings, availability, and booking management. Built with Node.js, TypeScript, PostgreSQL, and Redis.

## Features

- 🏠 **Property Management**: List and search properties with advanced filtering
- 📅 **Availability Calendar**: Real-time availability checking
- 💰 **Dynamic Pricing**: Rate quotes with fees and taxes
- 🔐 **Secure Authentication**: API Key and OAuth2 support
- 🌍 **Geospatial Search**: Bounding box and radius queries with PostGIS
- 🔒 **Privacy Controls**: Address masking and coordinate precision control
- 📦 **Image CDN**: Dynamic image transformation support
- 🔄 **Webhooks**: Real-time event notifications
- ⚡ **Rate Limiting**: Redis-backed rate limiting per API key
- 📊 **No PII Exposure**: Guest data handled externally

## Tech Stack

- **Runtime**: Node.js v20+
- **Language**: TypeScript
- **Framework**: Express
- **Database**: PostgreSQL 15+ with PostGIS
- **Cache**: Redis 7+
- **Authentication**: JWT, API Keys, OAuth2

## Quick Start

### Prerequisites

- Node.js v20+
- Docker and Docker Compose
- PostgreSQL 15+ (or use Docker)
- Redis 7+ (or use Docker)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd openstays
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start the database and Redis**
```bash
docker-compose up -d
```

5. **Run database migrations**
```bash
# The init.sql will be automatically executed by Docker
# To seed test data:
docker exec -i openstays_postgres psql -U openstays_user -d openstays < database/seed.sql
```

6. **Start the development server**
```bash
npm run dev
```

The API will be available at `http://localhost:3000/v1`

## API Endpoints

### Properties

- `GET /v1/properties` - List properties with filters
- `GET /v1/properties/:id` - Get property details

### Availability

- `GET /v1/availability` - Get availability calendar

### Rates

- `GET /v1/rates/quote` - Get pricing quote

### Search

- `GET /v1/search` - Advanced search with availability

### Bookings

- `POST /v1/bookings/hold` - Create temporary hold
- `POST /v1/bookings/confirm` - Initiate checkout
- `POST /v1/bookings/release` - Release hold

### Webhooks

- `POST /v1/webhooks/endpoints` - Register webhook
- `GET /v1/webhooks/endpoints` - List webhooks
- `POST /v1/webhooks/test` - Test webhook

## Development

### Running Tests

```bash
npm test
```

### Building for Production

```bash
npm run build
npm start
```

### Type Checking

```bash
npm run lint
```

## API Authentication

### API Key Authentication

Include your API key in the request header:
```
X-API-Key: osk_your_api_key_here
```

### OAuth2 Authentication

Use the OAuth2 client credentials flow:
1. Get an access token from the auth endpoint
2. Include the token in the Authorization header:
```
Authorization: Bearer your_access_token
```

## Query Parameters

### Common Filters

- `limit` - Page size (max 200, default 50)
- `cursor` - Pagination cursor
- `address_masking` - Enable privacy mode
- `mask_precision` - Coordinate rounding (0-5 decimal places)

### Property Filters

- `region_id` - Filter by region
- `bbox` - Bounding box (minLon,minLat,maxLon,maxLat)
- `near` - Radius search (lat,lon,radiusMeters)
- `guests` - Minimum occupancy
- `amenities` - Comma-separated amenity list
- `pets_allowed` - Pet-friendly properties
- `instant_book` - Instant booking available

### Image Transformation

- `img_w` - Max width (16-4096px)
- `img_h` - Max height (16-4096px)
- `img_fit` - Resize mode (cover, contain, fill, inside, outside)
- `img_q` - Quality (1-100)
- `img_dpr` - Device pixel ratio (0.5-4)

## Rate Limiting

Default: 1200 requests per minute per API key

Rate limit headers:
- `X-RateLimit-Limit` - Request limit
- `X-RateLimit-Remaining` - Remaining requests
- `X-RateLimit-Reset` - Reset timestamp

## Error Responses

```json
{
  "code": "ERROR_CODE",
  "message": "Human-readable error message",
  "request_id": "req_123456789"
}
```

Common error codes:
- `VALIDATION_ERROR` - Invalid request parameters
- `NOT_FOUND` - Resource not found
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `AUTHENTICATION_REQUIRED` - Missing authentication
- `INSUFFICIENT_SCOPE` - Missing required permissions

## License

[Your License]

## Support

For issues and questions, please open a GitHub issue.