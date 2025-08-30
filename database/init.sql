-- Enable PostGIS extension for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE property_status AS ENUM ('active', 'inactive', 'suspended', 'draft');
CREATE TYPE property_type AS ENUM ('house', 'apartment', 'villa', 'cabin', 'motel_room', 'hotel_room', 'tiny_home', 'lodge', 'cottage', 'studio');
CREATE TYPE bed_type AS ENUM ('single', 'twin', 'queen', 'king', 'super_king', 'bunk', 'sofa_bed', 'futon');
CREATE TYPE cancellation_tier AS ENUM ('flexible', 'moderate', 'strict', 'super_strict');
CREATE TYPE pet_fee_type AS ENUM ('per_pet_per_night', 'per_pet_per_booking', 'per_booking', 'none');
CREATE TYPE referral_type AS ENUM ('guest', 'affiliate', 'partner');
CREATE TYPE referral_reward_type AS ENUM ('percent_of_booking', 'fixed_amount');

-- Properties table
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    status property_status NOT NULL DEFAULT 'draft',
    title VARCHAR(255) NOT NULL,
    summary TEXT,
    description TEXT,
    
    -- Address fields
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    region VARCHAR(100) NOT NULL,
    country VARCHAR(2) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    
    -- Geospatial data
    coordinates GEOGRAPHY(POINT, 4326) NOT NULL,
    region_id VARCHAR(50) NOT NULL,
    
    -- Property details
    property_type property_type NOT NULL,
    max_occupancy INTEGER NOT NULL CHECK (max_occupancy > 0),
    bedrooms INTEGER DEFAULT 0,
    bathrooms DECIMAL(3,1) DEFAULT 0,
    
    -- Policies
    instant_book BOOLEAN DEFAULT false,
    min_stay_nights INTEGER DEFAULT 1 CHECK (min_stay_nights > 0),
    max_stay_nights INTEGER CHECK (max_stay_nights >= min_stay_nights),
    buffer_days_before INTEGER DEFAULT 0,
    buffer_days_after INTEGER DEFAULT 0,
    cancellation_tier cancellation_tier DEFAULT 'moderate',
    
    -- Pet policy
    pets_allowed BOOLEAN DEFAULT false,
    max_pets INTEGER DEFAULT 0,
    pet_fee_type pet_fee_type,
    pet_fee_amount DECIMAL(10,2),
    pet_fee_currency VARCHAR(3) DEFAULT 'USD',
    
    -- Fees
    cleaning_fee DECIMAL(10,2),
    cleaning_fee_currency VARCHAR(3) DEFAULT 'USD',
    security_deposit DECIMAL(10,2),
    security_deposit_currency VARCHAR(3) DEFAULT 'USD',
    additional_guest_after INTEGER,
    additional_guest_fee DECIMAL(10,2),
    additional_guest_fee_currency VARCHAR(3) DEFAULT 'USD',
    
    -- Tax info
    gst_registered BOOLEAN DEFAULT false,
    gst_number VARCHAR(50),
    
    -- Rating
    rating_average DECIMAL(2,1) CHECK (rating_average >= 0 AND rating_average <= 5),
    rating_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for common queries
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_region_id ON properties(region_id);
CREATE INDEX idx_properties_coordinates ON properties USING GIST(coordinates);
CREATE INDEX idx_properties_max_occupancy ON properties(max_occupancy);
CREATE INDEX idx_properties_property_type ON properties(property_type);
CREATE INDEX idx_properties_pets_allowed ON properties(pets_allowed);
CREATE INDEX idx_properties_instant_book ON properties(instant_book);
CREATE INDEX idx_properties_rating ON properties(rating_average) WHERE rating_average IS NOT NULL;

-- Property photos table
CREATE TABLE property_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    caption TEXT,
    width INTEGER,
    height INTEGER,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_property_photos_property ON property_photos(property_id);
CREATE INDEX idx_property_photos_order ON property_photos(property_id, display_order);

-- Property amenities table
CREATE TABLE property_amenities (
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    amenity VARCHAR(50) NOT NULL,
    PRIMARY KEY (property_id, amenity)
);

CREATE INDEX idx_property_amenities_amenity ON property_amenities(amenity);

-- Property accessibility features table
CREATE TABLE property_accessibility (
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    feature VARCHAR(50) NOT NULL,
    PRIMARY KEY (property_id, feature)
);

CREATE INDEX idx_property_accessibility_feature ON property_accessibility(feature);

-- Property tags table
CREATE TABLE property_tags (
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    tag VARCHAR(50) NOT NULL,
    PRIMARY KEY (property_id, tag)
);

CREATE INDEX idx_property_tags_tag ON property_tags(tag);

-- Bed configurations table
CREATE TABLE property_bed_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    room_label VARCHAR(100),
    bed_type bed_type NOT NULL,
    bed_count INTEGER NOT NULL DEFAULT 1 CHECK (bed_count > 0)
);

CREATE INDEX idx_bed_configs_property ON property_bed_configs(property_id);

-- Check-in/out days table
CREATE TABLE property_booking_days (
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    day_type VARCHAR(10) NOT NULL CHECK (day_type IN ('check_in', 'check_out')),
    day_of_week VARCHAR(3) NOT NULL CHECK (day_of_week IN ('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun')),
    PRIMARY KEY (property_id, day_type, day_of_week)
);

-- Availability calendar table
CREATE TABLE availability (
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    available BOOLEAN NOT NULL DEFAULT true,
    min_stay_nights INTEGER,
    is_check_in_allowed BOOLEAN DEFAULT true,
    is_check_out_allowed BOOLEAN DEFAULT true,
    PRIMARY KEY (property_id, date)
);

CREATE INDEX idx_availability_date ON availability(date);
CREATE INDEX idx_availability_available ON availability(property_id, date) WHERE available = true;

-- Rates table
CREATE TABLE rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    nightly_rate DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

CREATE INDEX idx_rates_property ON rates(property_id);
CREATE INDEX idx_rates_dates ON rates(property_id, start_date, end_date);

-- Referral codes table
CREATE TABLE referrals (
    code VARCHAR(50) PRIMARY KEY,
    valid BOOLEAN DEFAULT true,
    type referral_type NOT NULL,
    reward_type referral_reward_type NOT NULL,
    reward_value DECIMAL(10,2) NOT NULL,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_referrals_valid ON referrals(code) WHERE valid = true;

-- Booking holds table
CREATE TABLE booking_holds (
    hold_token VARCHAR(100) PRIMARY KEY,
    property_id UUID NOT NULL REFERENCES properties(id),
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    guests INTEGER NOT NULL CHECK (guests > 0),
    pets INTEGER DEFAULT 0,
    ref_code VARCHAR(50),
    quote_total DECIMAL(10,2) NOT NULL,
    quote_currency VARCHAR(3) DEFAULT 'USD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    released BOOLEAN DEFAULT false,
    confirmed BOOLEAN DEFAULT false
);

CREATE INDEX idx_holds_property ON booking_holds(property_id);
CREATE INDEX idx_holds_dates ON booking_holds(property_id, check_in, check_out);
CREATE INDEX idx_holds_expires ON booking_holds(expires_at) WHERE released = false AND confirmed = false;

-- API keys table
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key_hash VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(100),
    scopes TEXT[],
    rate_limit INTEGER DEFAULT 1200,
    active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_api_keys_hash ON api_keys(key_hash) WHERE active = true;

-- OAuth clients table
CREATE TABLE oauth_clients (
    client_id VARCHAR(100) PRIMARY KEY,
    client_secret_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    scopes TEXT[],
    redirect_uris TEXT[],
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- OAuth tokens table
CREATE TABLE oauth_tokens (
    token VARCHAR(255) PRIMARY KEY,
    client_id VARCHAR(100) NOT NULL REFERENCES oauth_clients(client_id),
    scopes TEXT[],
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_oauth_tokens_expires ON oauth_tokens(expires_at);

-- Webhook endpoints table
CREATE TABLE webhook_endpoints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url TEXT NOT NULL,
    secret VARCHAR(255) NOT NULL,
    events TEXT[] NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_webhook_endpoints_active ON webhook_endpoints(active);

-- Webhook deliveries table (for tracking/retries)
CREATE TABLE webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    endpoint_id UUID NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    event_id VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    attempts INTEGER DEFAULT 0,
    last_attempt_at TIMESTAMP WITH TIME ZONE,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    response_status INTEGER,
    response_body TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_webhook_deliveries_endpoint ON webhook_deliveries(endpoint_id);
CREATE INDEX idx_webhook_deliveries_status ON webhook_deliveries(status);
CREATE INDEX idx_webhook_deliveries_retry ON webhook_deliveries(next_retry_at) WHERE status = 'pending';

-- Create update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webhook_endpoints_updated_at BEFORE UPDATE ON webhook_endpoints
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();