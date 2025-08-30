-- Seed script for test data

-- Insert test properties
INSERT INTO properties (
    id,
    status,
    title,
    summary,
    description,
    address_line1,
    city,
    region,
    country,
    postal_code,
    coordinates,
    region_id,
    property_type,
    max_occupancy,
    bedrooms,
    bathrooms,
    instant_book,
    min_stay_nights,
    cancellation_tier,
    pets_allowed,
    max_pets,
    cleaning_fee,
    rating_average,
    rating_count
) VALUES 
(
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'active',
    'Beachfront Villa with Ocean Views',
    'Stunning beachfront villa with panoramic ocean views',
    'Experience luxury living in this stunning beachfront villa featuring panoramic ocean views, modern amenities, and direct beach access. Perfect for families or groups looking for an unforgettable coastal retreat.',
    '123 Coastal Highway',
    'Byron Bay',
    'New South Wales',
    'AU',
    '2481',
    ST_SetSRID(ST_MakePoint(153.6120, -28.6432), 4326),
    'byron-bay',
    'villa',
    8,
    4,
    3.5,
    true,
    2,
    'moderate',
    true,
    2,
    150.00,
    4.8,
    127
),
(
    'b2c3d4e5-f6a7-8901-bcde-f23456789012',
    'active',
    'Mountain Cabin Retreat',
    'Cozy mountain cabin surrounded by nature',
    'Escape to this charming mountain cabin nestled in pristine wilderness. Features a wood-burning fireplace, hot tub, and hiking trails right at your doorstep.',
    '456 Mountain Road',
    'Queenstown',
    'Otago',
    'NZ',
    '9300',
    ST_SetSRID(ST_MakePoint(168.6626, -45.0312), 4326),
    'queenstown',
    'cabin',
    4,
    2,
    1,
    false,
    3,
    'strict',
    false,
    0,
    100.00,
    4.6,
    89
),
(
    'c3d4e5f6-a7b8-9012-cdef-345678901234',
    'active',
    'City Center Apartment',
    'Modern apartment in the heart of the city',
    'Stylish urban apartment with city skyline views, walking distance to restaurants, shopping, and public transport. Ideal for business travelers or city explorers.',
    '789 City Plaza',
    'Melbourne',
    'Victoria',
    'AU',
    '3000',
    ST_SetSRID(ST_MakePoint(144.9631, -37.8136), 4326),
    'melbourne-cbd',
    'apartment',
    2,
    1,
    1,
    true,
    1,
    'flexible',
    false,
    0,
    75.00,
    4.5,
    234
);

-- Insert property photos
INSERT INTO property_photos (property_id, url, caption, width, height, display_order) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'https://example.com/images/villa-exterior.jpg', 'Villa exterior view', 1920, 1080, 1),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'https://example.com/images/villa-living.jpg', 'Spacious living area', 1920, 1080, 2),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'https://example.com/images/villa-pool.jpg', 'Private pool area', 1920, 1080, 3),
('b2c3d4e5-f6a7-8901-bcde-f23456789012', 'https://example.com/images/cabin-exterior.jpg', 'Cabin in the woods', 1920, 1080, 1),
('b2c3d4e5-f6a7-8901-bcde-f23456789012', 'https://example.com/images/cabin-interior.jpg', 'Cozy interior', 1920, 1080, 2),
('c3d4e5f6-a7b8-9012-cdef-345678901234', 'https://example.com/images/apartment-view.jpg', 'City skyline view', 1920, 1080, 1);

-- Insert amenities
INSERT INTO property_amenities (property_id, amenity) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'wifi'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'pool'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'beach_access'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'aircon'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'parking'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'bbq'),
('b2c3d4e5-f6a7-8901-bcde-f23456789012', 'wifi'),
('b2c3d4e5-f6a7-8901-bcde-f23456789012', 'hot_tub'),
('b2c3d4e5-f6a7-8901-bcde-f23456789012', 'fireplace'),
('b2c3d4e5-f6a7-8901-bcde-f23456789012', 'parking'),
('b2c3d4e5-f6a7-8901-bcde-f23456789012', 'mountain_view'),
('c3d4e5f6-a7b8-9012-cdef-345678901234', 'wifi'),
('c3d4e5f6-a7b8-9012-cdef-345678901234', 'aircon'),
('c3d4e5f6-a7b8-9012-cdef-345678901234', 'workspace');

-- Insert accessibility features
INSERT INTO property_accessibility (property_id, feature) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'step_free'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'wide_doorways'),
('c3d4e5f6-a7b8-9012-cdef-345678901234', 'elevator'),
('c3d4e5f6-a7b8-9012-cdef-345678901234', 'no_stairs');

-- Insert bed configurations
INSERT INTO property_bed_configs (property_id, room_label, bed_type, bed_count) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Master Bedroom', 'king', 1),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Guest Room 1', 'queen', 1),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Guest Room 2', 'single', 2),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Kids Room', 'bunk', 1),
('b2c3d4e5-f6a7-8901-bcde-f23456789012', 'Master Bedroom', 'queen', 1),
('b2c3d4e5-f6a7-8901-bcde-f23456789012', 'Guest Room', 'single', 2),
('c3d4e5f6-a7b8-9012-cdef-345678901234', 'Bedroom', 'queen', 1);

-- Insert sample availability (next 30 days)
DO $$
DECLARE
    prop_id UUID;
    curr_date DATE := CURRENT_DATE;
    end_date DATE := CURRENT_DATE + INTERVAL '30 days';
BEGIN
    FOR prop_id IN SELECT id FROM properties LOOP
        WHILE curr_date <= end_date LOOP
            INSERT INTO availability (property_id, date, available, min_stay_nights, is_check_in_allowed, is_check_out_allowed)
            VALUES (
                prop_id,
                curr_date,
                -- Random availability (80% chance of being available)
                random() > 0.2,
                -- Min stay nights varies by day of week
                CASE EXTRACT(DOW FROM curr_date)
                    WHEN 5 THEN 2  -- Friday
                    WHEN 6 THEN 2  -- Saturday
                    ELSE 1
                END,
                true,
                true
            );
            curr_date := curr_date + INTERVAL '1 day';
        END LOOP;
        curr_date := CURRENT_DATE;
    END LOOP;
END $$;

-- Insert sample rates
INSERT INTO rates (property_id, start_date, end_date, nightly_rate) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', CURRENT_DATE, CURRENT_DATE + INTERVAL '90 days', 450.00),
('b2c3d4e5-f6a7-8901-bcde-f23456789012', CURRENT_DATE, CURRENT_DATE + INTERVAL '90 days', 250.00),
('c3d4e5f6-a7b8-9012-cdef-345678901234', CURRENT_DATE, CURRENT_DATE + INTERVAL '90 days', 150.00);

-- Insert test API key
INSERT INTO api_keys (key_hash, name, scopes, rate_limit, active) VALUES
('$2b$10$YourHashedApiKeyHere', 'Test API Key', ARRAY['listings:read', 'availability:read', 'rates:read'], 1200, true);

-- Insert test referral code
INSERT INTO referrals (code, valid, type, reward_type, reward_value, note) VALUES
('WELCOME10', true, 'guest', 'percent_of_booking', 10, 'Welcome discount for new guests'),
('PARTNER25', true, 'partner', 'fixed_amount', 25, 'Partner referral program');