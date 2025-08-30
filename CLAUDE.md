# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains an OpenAPI 3.1.0 specification for a property listing and booking API (OpenStays). The API is designed as a read-heavy, public-facing service that enables third-party booking sites and regional portals to access property listings, availability, rates, and handle booking handoffs without exposing guest PII.

## API Specification Structure

The main API specification is in `api.yaml` and includes:

### Core Components
- **Authentication**: API Key and OAuth2 Client Credentials
- **Main Resources**: Properties, Availability, Rates, Bookings, Referrals, Webhooks
- **Privacy Features**: Address masking, coordinate precision control, no PII exposure
- **Image CDN**: Dynamic image transformation parameters (width, height, quality, DPR)

### Key Endpoints
- `/properties` - List and filter properties with extensive query parameters
- `/search` - Aggregated search with availability and pricing
- `/availability` - Calendar availability per property
- `/rates/quote` - Dynamic pricing quotes for stays
- `/bookings/hold` - Create temporary inventory holds
- `/bookings/confirm` - Initiate checkout redirect (PII handled externally)
- `/webhooks/endpoints` - Webhook management for real-time updates

### Booking Flow
1. Optional: GET `/rates/quote` for price preview
2. POST `/bookings/hold` to reserve inventory temporarily
3. POST `/bookings/confirm` to get redirect URL
4. User redirected to hosted checkout (external system handles PII/payment)

## Development Guidelines

### When Modifying the API Specification

1. **OpenAPI Version**: Maintain OpenAPI 3.1.0 compatibility
2. **Schema Reuse**: Use `$ref` for shared schemas in `components/schemas`
3. **Parameter Reuse**: Define common parameters in `components/parameters`
4. **Consistent Naming**: Use snake_case for properties and parameters
5. **Required Fields**: Explicitly mark required fields in schemas
6. **Enums**: Use enums for fixed value sets (e.g., property types, bed types)

### API Design Principles

- **No PII Exposure**: Never add fields that could contain guest personal information
- **Privacy by Default**: Support address masking and coordinate precision control
- **Idempotency**: Support `Idempotency-Key` header for critical operations
- **Rate Limiting**: Include rate limit headers in responses
- **Versioning**: Use URL versioning (`/v1`, `/v2`)

### Validation Commands

To validate the OpenAPI specification:
```bash
# Using spectral (if installed)
spectral lint api.yaml

# Using openapi-generator-cli (if installed)
openapi-generator-cli validate -i api.yaml

# Using swagger-cli (if installed)
swagger-cli validate api.yaml
```

### Development Commands

**Initial Setup:**
```bash
# Run the automated setup script
./scripts/setup.sh

# Or manually:
docker-compose up -d
npm install
npm run dev
```

**Common Commands:**
```bash
# Development server with hot reload
npm run dev

# Build TypeScript
npm run build

# Run production build
npm start

# Type checking
npm run lint

# Run tests
npm test

# Run tests in watch mode
npm test:watch
```

**Database Commands:**
```bash
# Connect to PostgreSQL
docker exec -it openstays_postgres psql -U openstays_user -d openstays

# Seed test data
docker exec -i openstays_postgres psql -U openstays_user -d openstays < database/seed.sql

# View logs
docker-compose logs -f postgres
docker-compose logs -f redis
```

## Common Tasks

**Adding a new endpoint:**
1. Define the path under `paths`
2. Add request/response schemas to `components/schemas`
3. Reuse parameters from `components/parameters` where possible
4. Include appropriate security requirements
5. Add rate limiting headers to responses

**Adding a new filter parameter:**
1. Define in `components/parameters` if reusable
2. Include proper validation (pattern, min/max, enum)
3. Add to relevant endpoints
4. Document the behavior clearly

**Modifying schemas:**
1. Check for schema usage across the spec before modifying
2. Maintain backward compatibility when possible
3. Update required fields carefully
4. Consider impact on webhook payloads