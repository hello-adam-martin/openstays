import { query, queryOne } from '../database';
import { Property, BedConfig, PaginatedResponse } from '../types';

export interface PropertyFilters {
  region_id?: string;
  bbox?: string;
  near?: string;
  amenities?: string;
  accessibility?: string;
  pets_allowed?: boolean;
  max_pets?: number;
  guests?: number;
  bed_types?: string;
  instant_book?: boolean;
  cancellation_tier?: string;
  sort?: string;
  seed?: number;
  limit?: number;
  cursor?: string;
  address_masking?: boolean;
  mask_precision?: number;
}

export class PropertyService {
  async listProperties(filters: PropertyFilters): Promise<PaginatedResponse<Property>> {
    const limit = filters.limit || 50;
    const conditions: string[] = ["p.status = 'active'"];
    const params: any[] = [];
    let paramCount = 0;

    if (filters.region_id) {
      conditions.push(`p.region_id = $${++paramCount}`);
      params.push(filters.region_id);
    }

    if (filters.guests) {
      conditions.push(`p.max_occupancy >= $${++paramCount}`);
      params.push(filters.guests);
    }

    if (filters.pets_allowed !== undefined) {
      conditions.push(`p.pets_allowed = $${++paramCount}`);
      params.push(filters.pets_allowed);
    }

    if (filters.max_pets !== undefined) {
      conditions.push(`p.max_pets >= $${++paramCount}`);
      params.push(filters.max_pets);
    }

    if (filters.instant_book !== undefined) {
      conditions.push(`p.instant_book = $${++paramCount}`);
      params.push(filters.instant_book);
    }

    if (filters.cancellation_tier) {
      conditions.push(`p.cancellation_tier = $${++paramCount}`);
      params.push(filters.cancellation_tier);
    }

    if (filters.bbox) {
      const [minLon, minLat, maxLon, maxLat] = filters.bbox.split(',').map(Number);
      conditions.push(`ST_Within(
        p.coordinates,
        ST_MakeEnvelope($${++paramCount}, $${++paramCount}, $${++paramCount}, $${++paramCount}, 4326)
      )`);
      params.push(minLon, minLat, maxLon, maxLat);
    }

    if (filters.near) {
      const [lat, lon, radius] = filters.near.split(',').map(Number);
      conditions.push(`ST_DWithin(
        p.coordinates,
        ST_SetSRID(ST_MakePoint($${++paramCount}, $${++paramCount}), 4326)::geography,
        $${++paramCount}
      )`);
      params.push(lon, lat, radius);
    }

    if (filters.cursor) {
      const decodedCursor = Buffer.from(filters.cursor, 'base64').toString('utf-8');
      conditions.push(`p.id > $${++paramCount}`);
      params.push(decodedCursor);
    }

    let orderBy = 'ORDER BY p.created_at DESC, p.id';
    if (filters.sort) {
      switch (filters.sort) {
        case 'price_asc':
          orderBy = 'ORDER BY p.id'; 
          break;
        case 'price_desc':
          orderBy = 'ORDER BY p.id DESC';
          break;
        case 'rating_desc':
          orderBy = 'ORDER BY p.rating_average DESC NULLS LAST, p.id';
          break;
        case 'distance_asc':
          if (filters.near) {
            const [lat, lon] = filters.near.split(',').map(Number);
            orderBy = `ORDER BY ST_Distance(p.coordinates, ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography), p.id`;
          }
          break;
        case 'random':
          const seed = filters.seed || Math.random();
          orderBy = `ORDER BY md5(p.id::text || '${seed}'), p.id`;
          break;
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    const sqlQuery = `
      SELECT 
        p.*,
        ST_Y(p.coordinates::geometry) as lat,
        ST_X(p.coordinates::geometry) as lon,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'url', pp.url,
              'caption', pp.caption,
              'width', pp.width,
              'height', pp.height,
              'order', pp.display_order
            )
          ) FILTER (WHERE pp.id IS NOT NULL),
          '[]'::json
        ) as photos,
        COALESCE(array_agg(DISTINCT pa.amenity) FILTER (WHERE pa.amenity IS NOT NULL), '{}') as amenities,
        COALESCE(array_agg(DISTINCT pac.feature) FILTER (WHERE pac.feature IS NOT NULL), '{}') as accessibility,
        COALESCE(array_agg(DISTINCT pt.tag) FILTER (WHERE pt.tag IS NOT NULL), '{}') as tags
      FROM properties p
      LEFT JOIN property_photos pp ON p.id = pp.property_id
      LEFT JOIN property_amenities pa ON p.id = pa.property_id
      LEFT JOIN property_accessibility pac ON p.id = pac.property_id
      LEFT JOIN property_tags pt ON p.id = pt.property_id
      ${whereClause}
      GROUP BY p.id
      ${orderBy}
      LIMIT $${++paramCount}
    `;
    
    params.push(limit + 1);

    const rows = await query<any>(sqlQuery, params);
    const hasMore = rows.length > limit;
    const properties = rows.slice(0, limit).map(row => this.mapRowToProperty(row, filters.address_masking, filters.mask_precision));

    const nextCursor = hasMore ? Buffer.from(properties[properties.length - 1].id).toString('base64') : null;

    return {
      data: properties,
      next_cursor: nextCursor,
    };
  }

  async getPropertyById(id: string, addressMasking?: boolean, maskPrecision?: number): Promise<Property | null> {
    const sqlQuery = `
      SELECT 
        p.*,
        ST_Y(p.coordinates::geometry) as lat,
        ST_X(p.coordinates::geometry) as lon,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'url', pp.url,
              'caption', pp.caption,
              'width', pp.width,
              'height', pp.height,
              'order', pp.display_order
            )
          ) FILTER (WHERE pp.id IS NOT NULL),
          '[]'::json
        ) as photos,
        COALESCE(array_agg(DISTINCT pa.amenity) FILTER (WHERE pa.amenity IS NOT NULL), '{}') as amenities,
        COALESCE(array_agg(DISTINCT pac.feature) FILTER (WHERE pac.feature IS NOT NULL), '{}') as accessibility,
        COALESCE(array_agg(DISTINCT pt.tag) FILTER (WHERE pt.tag IS NOT NULL), '{}') as tags,
        json_agg(
          DISTINCT jsonb_build_object(
            'room_label', bc.room_label,
            'beds', json_build_object(
              'type', bc.bed_type,
              'count', bc.bed_count
            )
          )
        ) FILTER (WHERE bc.id IS NOT NULL) as bed_configs
      FROM properties p
      LEFT JOIN property_photos pp ON p.id = pp.property_id
      LEFT JOIN property_amenities pa ON p.id = pa.property_id
      LEFT JOIN property_accessibility pac ON p.id = pac.property_id
      LEFT JOIN property_tags pt ON p.id = pt.property_id
      LEFT JOIN property_bed_configs bc ON p.id = bc.property_id
      WHERE p.id = $1 AND p.status = 'active'
      GROUP BY p.id
    `;

    const row = await queryOne<any>(sqlQuery, [id]);
    
    if (!row) {
      return null;
    }

    return this.mapRowToProperty(row, addressMasking, maskPrecision);
  }

  private mapRowToProperty(row: any, addressMasking?: boolean, maskPrecision?: number): Property {
    const property: Property = {
      id: row.id,
      status: row.status,
      title: row.title,
      summary: row.summary,
      description: row.description,
      region_id: row.region_id,
      type: row.property_type,
      max_occupancy: row.max_occupancy,
      bedrooms: row.bedrooms,
      bathrooms: row.bathrooms ? parseFloat(row.bathrooms) : undefined,
      photos: row.photos || [],
      amenities: row.amenities || [],
      accessibility: row.accessibility || [],
      tags: row.tags || [],
      created_at: row.created_at,
      updated_at: row.updated_at,
    };

    if (addressMasking) {
      property.public_address = {
        city: row.city,
        region: row.region,
        country: row.country,
        postal_code: row.postal_code,
      };
      
      const precision = maskPrecision || 2;
      property.public_coordinates = {
        lat: this.roundCoordinate(row.lat, precision),
        lon: this.roundCoordinate(row.lon, precision),
      };
    } else {
      property.address = {
        line1: row.address_line1,
        line2: row.address_line2,
        city: row.city,
        region: row.region,
        country: row.country,
        postal_code: row.postal_code,
      };
      
      property.coordinates = {
        lat: row.lat,
        lon: row.lon,
      };
    }

    if (row.bed_configs) {
      property.bed_config = this.mapBedConfigs(row.bed_configs);
    }

    property.pet_policy = {
      allowed: row.pets_allowed || false,
      max_pets: row.max_pets,
      fee_type: row.pet_fee_type,
      fee: row.pet_fee_amount ? {
        amount: parseFloat(row.pet_fee_amount),
        currency: row.pet_fee_currency || 'USD',
      } : undefined,
    };

    property.booking_policy = {
      instant_book: row.instant_book || false,
      min_stay_nights: row.min_stay_nights || 1,
      max_stay_nights: row.max_stay_nights,
      buffer_days_before: row.buffer_days_before,
      buffer_days_after: row.buffer_days_after,
      cancellation_tier: row.cancellation_tier,
    };

    property.fees = {};
    if (row.cleaning_fee) {
      property.fees.cleaning_fee = {
        amount: parseFloat(row.cleaning_fee),
        currency: row.cleaning_fee_currency || 'USD',
      };
    }
    if (row.security_deposit) {
      property.fees.security_deposit = {
        amount: parseFloat(row.security_deposit),
        currency: row.security_deposit_currency || 'USD',
      };
    }
    if (row.additional_guest_after && row.additional_guest_fee) {
      property.fees.additional_guest_fee = {
        applies_after_guests: row.additional_guest_after,
        per_guest_per_night: {
          amount: parseFloat(row.additional_guest_fee),
          currency: row.additional_guest_fee_currency || 'USD',
        },
      };
    }

    property.tax_info = {
      gst_registered: row.gst_registered || false,
      gst_number: row.gst_number,
    };

    if (row.rating_average) {
      property.rating = {
        average: parseFloat(row.rating_average),
        count: row.rating_count || 0,
      };
    }

    return property;
  }

  private mapBedConfigs(configs: any[]): BedConfig[] {
    const grouped: { [key: string]: BedConfig } = {};
    
    for (const config of configs) {
      const roomLabel = config.room_label || 'Bedroom';
      if (!grouped[roomLabel]) {
        grouped[roomLabel] = {
          room_label: roomLabel,
          beds: [],
        };
      }
      
      if (config.beds) {
        grouped[roomLabel].beds.push({
          type: config.beds.type,
          count: config.beds.count,
        });
      }
    }
    
    return Object.values(grouped);
  }

  private roundCoordinate(coord: number, precision: number): number {
    const multiplier = Math.pow(10, precision);
    return Math.round(coord * multiplier) / multiplier;
  }

  async checkAmenityFilters(propertyId: string, amenities: string[]): Promise<boolean> {
    const result = await queryOne<{ count: number }>(
      `SELECT COUNT(*) as count 
       FROM property_amenities 
       WHERE property_id = $1 AND amenity = ANY($2)`,
      [propertyId, amenities]
    );
    
    return result ? result.count === amenities.length : false;
  }

  async checkAccessibilityFilters(propertyId: string, features: string[]): Promise<boolean> {
    const result = await queryOne<{ count: number }>(
      `SELECT COUNT(*) as count 
       FROM property_accessibility 
       WHERE property_id = $1 AND feature = ANY($2)`,
      [propertyId, features]
    );
    
    return result ? result.count === features.length : false;
  }
}