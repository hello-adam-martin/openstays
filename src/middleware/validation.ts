import { Request, Response, NextFunction } from 'express';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

export interface ValidationSchema {
  query?: object;
  params?: object;
  body?: object;
}

export function validate(schema: ValidationSchema) {
  return (req: Request, res: Response, next: NextFunction): void | Response => {
    const errors: string[] = [];

    if (schema.query) {
      const validate = ajv.compile(schema.query);
      if (!validate(req.query)) {
        errors.push(...(validate.errors?.map(e => `query.${e.instancePath} ${e.message}`) || []));
      }
    }

    if (schema.params) {
      const validate = ajv.compile(schema.params);
      if (!validate(req.params)) {
        errors.push(...(validate.errors?.map(e => `params.${e.instancePath} ${e.message}`) || []));
      }
    }

    if (schema.body) {
      const validate = ajv.compile(schema.body);
      if (!validate(req.body)) {
        errors.push(...(validate.errors?.map(e => `body.${e.instancePath} ${e.message}`) || []));
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        errors,
        request_id: req.header('X-Request-ID'),
      });
    }

    next();
  };
}

export const schemas = {
  pagination: {
    type: 'object',
    properties: {
      limit: { type: 'integer', minimum: 1, maximum: 200, default: 50 },
      cursor: { type: 'string' },
    },
  },
  
  propertyFilters: {
    type: 'object',
    properties: {
      region_id: { type: 'string' },
      bbox: { type: 'string', pattern: '^-?\\d+\\.\\d+,-?\\d+\\.\\d+,-?\\d+\\.\\d+,-?\\d+\\.\\d+$' },
      near: { type: 'string', pattern: '^-?\\d+\\.\\d+,-?\\d+\\.\\d+,[0-9]+$' },
      amenities: { type: 'string' },
      accessibility: { type: 'string' },
      pets_allowed: { type: 'boolean' },
      max_pets: { type: 'integer', minimum: 0 },
      guests: { type: 'integer', minimum: 1 },
      bed_types: { type: 'string' },
      instant_book: { type: 'boolean' },
      cancellation_tier: { enum: ['flexible', 'moderate', 'strict', 'super_strict'] },
      address_masking: { type: 'boolean', default: false },
      mask_precision: { type: 'integer', minimum: 0, maximum: 5, default: 2 },
      sort: { enum: ['relevance', 'price_asc', 'price_desc', 'rating_desc', 'distance_asc', 'random'] },
      seed: { type: 'integer' },
      img_w: { type: 'integer', minimum: 16, maximum: 4096 },
      img_h: { type: 'integer', minimum: 16, maximum: 4096 },
      img_fit: { enum: ['cover', 'contain', 'fill', 'inside', 'outside'] },
      img_q: { type: 'integer', minimum: 1, maximum: 100 },
      img_dpr: { type: 'number', minimum: 0.5, maximum: 4, default: 1 },
    },
  },

  searchFilters: {
    type: 'object',
    properties: {
      check_in: { type: 'string', format: 'date' },
      check_out: { type: 'string', format: 'date' },
      price_min: { type: 'number' },
      price_max: { type: 'number' },
    },
  },

  availabilityQuery: {
    type: 'object',
    required: ['property_id', 'start', 'end'],
    properties: {
      property_id: { type: 'string' },
      start: { type: 'string', format: 'date' },
      end: { type: 'string', format: 'date' },
    },
  },

  rateQuoteQuery: {
    type: 'object',
    required: ['property_id', 'check_in', 'check_out', 'guests'],
    properties: {
      property_id: { type: 'string' },
      check_in: { type: 'string', format: 'date' },
      check_out: { type: 'string', format: 'date' },
      guests: { type: 'integer', minimum: 1 },
      pets: { type: 'integer', minimum: 0 },
      ref_code: { type: 'string' },
    },
  },

  holdRequest: {
    type: 'object',
    required: ['property_id', 'check_in', 'check_out', 'guests'],
    properties: {
      property_id: { type: 'string' },
      check_in: { type: 'string', format: 'date' },
      check_out: { type: 'string', format: 'date' },
      guests: { type: 'integer', minimum: 1 },
      pets: { type: 'integer', minimum: 0 },
      ref_code: { type: 'string' },
    },
  },

  confirmRequest: {
    type: 'object',
    required: ['hold_token'],
    properties: {
      hold_token: { type: 'string' },
    },
  },

  webhookEndpoint: {
    type: 'object',
    required: ['url', 'events'],
    properties: {
      url: { type: 'string', format: 'uri' },
      secret: { type: 'string' },
      events: {
        type: 'array',
        items: {
          enum: [
            'property.created',
            'property.updated',
            'property.deleted',
            'availability.updated',
            'rates.updated',
            'booking.hold.created',
            'booking.hold.released',
            'booking.checkout.initiated',
          ],
        },
      },
    },
  },
};