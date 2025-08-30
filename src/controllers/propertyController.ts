import { Response, NextFunction } from 'express';
import { PropertyService, PropertyFilters } from '../services/propertyService';
import { AuthRequest } from '../middleware/auth';

const propertyService = new PropertyService();

export async function listProperties(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const filters: PropertyFilters = {
      region_id: req.query.region_id as string,
      bbox: req.query.bbox as string,
      near: req.query.near as string,
      amenities: req.query.amenities as string,
      accessibility: req.query.accessibility as string,
      pets_allowed: req.query.pets_allowed === 'true',
      max_pets: req.query.max_pets ? parseInt(req.query.max_pets as string, 10) : undefined,
      guests: req.query.guests ? parseInt(req.query.guests as string, 10) : undefined,
      bed_types: req.query.bed_types as string,
      instant_book: req.query.instant_book === 'true',
      cancellation_tier: req.query.cancellation_tier as string,
      sort: req.query.sort as string,
      seed: req.query.seed ? parseInt(req.query.seed as string, 10) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
      cursor: req.query.cursor as string,
      address_masking: req.query.address_masking === 'true',
      mask_precision: req.query.mask_precision ? parseInt(req.query.mask_precision as string, 10) : 2,
    };

    const result = await propertyService.listProperties(filters);
    
    res.json(result);
  } catch (error) {
    console.error('Error listing properties:', error);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to retrieve properties',
      request_id: req.header('X-Request-ID'),
    });
  }
}

export async function getPropertyById(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const addressMasking = req.query.address_masking === 'true';
    const maskPrecision = req.query.mask_precision ? parseInt(req.query.mask_precision as string, 10) : 2;

    const property = await propertyService.getPropertyById(id, addressMasking, maskPrecision);
    
    if (!property) {
      res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Property not found',
        request_id: req.header('X-Request-ID'),
      });
      return;
    }

    res.json(property);
  } catch (error) {
    console.error('Error getting property:', error);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to retrieve property',
      request_id: req.header('X-Request-ID'),
    });
  }
}