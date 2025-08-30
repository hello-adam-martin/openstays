export interface Money {
  amount: number;
  currency: string;
}

export interface Coordinates {
  lat: number;
  lon: number;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  region: string;
  country: string;
  postal_code: string;
}

export interface PublicAddress {
  city: string;
  region: string;
  country: string;
  postal_code: string;
  landmark_hint?: string;
}

export interface Photo {
  url: string;
  caption?: string;
  width?: number;
  height?: number;
  order?: number;
}

export type Amenity = 
  | 'wifi' | 'parking' | 'on_street_parking' | 'ev_charger' | 'kitchen' 
  | 'kitchenette' | 'laundry' | 'washer' | 'dryer' | 'aircon' | 'heating' 
  | 'heat_pump' | 'hot_tub' | 'spa_pool' | 'spa_bath' | 'pool' | 'fireplace' 
  | 'bbq' | 'ocean_view' | 'mountain_view' | 'garden' | 'patio' | 'balcony' 
  | 'crib' | 'high_chair' | 'workspace' | 'tv' | 'streaming' | 'sky_tv' 
  | 'netflix' | 'disney_plus' | 'board_games' | 'kayak' | 'bike_storage' 
  | 'beach_access' | 'ski_in_ski_out' | 'breakfast_included' | 'linen_included';

export type AccessibilityFeature = 
  | 'step_free' | 'grab_rails' | 'roll_in_shower' | 'shower_seat' 
  | 'wide_doorways' | 'no_stairs' | 'elevator' | 'ramp' | 'lowered_bed' 
  | 'hearing_assist' | 'visual_alarm' | 'accessible_parking';

export type BedType = 
  | 'single' | 'twin' | 'queen' | 'king' | 'super_king' 
  | 'bunk' | 'sofa_bed' | 'futon';

export interface BedConfig {
  room_label?: string;
  beds: Array<{
    type: BedType;
    count: number;
  }>;
}

export interface PetPolicy {
  allowed: boolean;
  max_pets?: number;
  fee_type?: 'per_pet_per_night' | 'per_pet_per_booking' | 'per_booking' | 'none';
  fee?: Money;
}

export interface BookingPolicy {
  instant_book: boolean;
  check_in_days?: Array<'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'>;
  check_out_days?: Array<'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'>;
  min_stay_nights: number;
  max_stay_nights?: number;
  buffer_days_before?: number;
  buffer_days_after?: number;
  cancellation_tier?: 'flexible' | 'moderate' | 'strict' | 'super_strict';
}

export interface Fees {
  cleaning_fee?: Money;
  additional_guest_fee?: {
    applies_after_guests: number;
    per_guest_per_night: Money;
  };
  security_deposit?: Money;
  service_fee?: Money;
}

export interface TaxInfo {
  gst_registered: boolean;
  gst_number?: string;
}

export type PropertyStatus = 'active' | 'inactive' | 'suspended' | 'draft';
export type PropertyType = 
  | 'house' | 'apartment' | 'villa' | 'cabin' | 'motel_room' 
  | 'hotel_room' | 'tiny_home' | 'lodge' | 'cottage' | 'studio';

export interface Property {
  id: string;
  status: PropertyStatus;
  title: string;
  summary?: string;
  description?: string;
  address?: Address;
  public_address?: PublicAddress;
  coordinates?: Coordinates;
  public_coordinates?: Coordinates;
  region_id: string;
  type: PropertyType;
  max_occupancy: number;
  bedrooms?: number;
  bathrooms?: number;
  bed_config?: BedConfig[];
  amenities?: Amenity[];
  accessibility?: AccessibilityFeature[];
  photos?: Photo[];
  pet_policy?: PetPolicy;
  booking_policy?: BookingPolicy;
  fees?: Fees;
  tax_info?: TaxInfo;
  rating?: {
    average: number;
    count: number;
  };
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface AvailabilityDay {
  date: string;
  available: boolean;
  min_stay_nights?: number;
  is_check_in_allowed?: boolean;
  is_check_out_allowed?: boolean;
}

export interface AvailabilityCalendar {
  property_id: string;
  start_date: string;
  end_date: string;
  days: AvailabilityDay[];
}

export interface Referral {
  code: string;
  valid: boolean;
  type?: 'guest' | 'affiliate' | 'partner';
  reward_type?: 'percent_of_booking' | 'fixed_amount';
  reward_value?: number;
  note?: string;
}

export interface RateQuote {
  property_id: string;
  check_in: string;
  check_out: string;
  guests: number;
  pets?: number;
  nightly?: Array<{
    date: string;
    price: Money;
  }>;
  fees?: Fees;
  taxes?: Array<{
    name: string;
    amount: Money;
  }>;
  total: Money;
  currency: string;
  ref_code?: string;
  referral_applied?: boolean;
  referral_estimate?: number;
  hold_token?: string;
  hold_expires_at?: string;
}

export interface HoldRequest {
  property_id: string;
  check_in: string;
  check_out: string;
  guests: number;
  pets?: number;
  ref_code?: string;
}

export interface HoldResponse {
  hold_token: string;
  quote?: RateQuote;
  expires_at: string;
}

export interface ConfirmRequest {
  hold_token: string;
}

export interface ConfirmResponse {
  status: 'redirect';
  booking_redirect_url: string;
  booking_id?: string;
}

export interface ApiError {
  code: string;
  message: string;
  request_id?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  next_cursor?: string | null;
}

export interface SearchResult {
  property: Property;
  eligible?: boolean;
  price_hint?: Money;
  distance_meters?: number;
}

export interface WebhookEndpoint {
  id?: string;
  url: string;
  secret?: string;
  events: string[];
}

export interface WebhookEvent {
  id: string;
  type: string;
  created_at: string;
  data: any;
}