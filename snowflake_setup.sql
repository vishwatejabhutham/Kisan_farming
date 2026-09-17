-- ==========================================
-- KISAN FARMING (AGRISCAN) SNOWFLAKE SCHEMA
-- ==========================================

-- 1. PROFILES TABLE
CREATE OR REPLACE TABLE PROFILES (
    id VARCHAR(36) DEFAULT UUID_STRING() PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL UNIQUE, 
    display_name VARCHAR(255),
    avatar_url VARCHAR(1024),
    created_at TIMESTAMP_TZ DEFAULT CURRENT_TIMESTAMP(),
    updated_at TIMESTAMP_TZ DEFAULT CURRENT_TIMESTAMP()
);

-- 2. DISEASE REPORTS TABLE
CREATE OR REPLACE TABLE DISEASE_REPORTS (
    id VARCHAR(36) DEFAULT UUID_STRING() PRIMARY KEY,
    district VARCHAR(100) NOT NULL,
    mandal VARCHAR(100),
    crop VARCHAR(100) NOT NULL,
    disease VARCHAR(100) NOT NULL,
    cases NUMBER(38,0) DEFAULT 0 NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium', 
    trend VARCHAR(20) DEFAULT 'stable',    
    trend_pct FLOAT DEFAULT 0.0,
    latitude FLOAT,
    longitude FLOAT,
    reported_by VARCHAR(36),
    notes VARCHAR(2000),
    created_at TIMESTAMP_TZ DEFAULT CURRENT_TIMESTAMP(),
    updated_at TIMESTAMP_TZ DEFAULT CURRENT_TIMESTAMP()
);

-- 3. INVENTORY TABLE
CREATE OR REPLACE TABLE INVENTORY (
    id VARCHAR(36) DEFAULT UUID_STRING() PRIMARY KEY,
    product VARCHAR(255) NOT NULL,
    district VARCHAR(100) NOT NULL,
    mandal VARCHAR(100),
    urgency VARCHAR(20) DEFAULT 'MEDIUM', 
    stock_units NUMBER(38,0) DEFAULT 0 NOT NULL,
    estimated_demand NUMBER(38,0) DEFAULT 0 NOT NULL,
    confidence FLOAT DEFAULT 0.0,
    created_at TIMESTAMP_TZ DEFAULT CURRENT_TIMESTAMP(),
    updated_at TIMESTAMP_TZ DEFAULT CURRENT_TIMESTAMP()
);

-- 4. ALERTS TABLE
CREATE OR REPLACE TABLE ALERTS (
    id VARCHAR(36) DEFAULT UUID_STRING() PRIMARY KEY,
    severity VARCHAR(20) DEFAULT 'medium',
    title VARCHAR(255) NOT NULL,
    message VARCHAR(2000),
    district VARCHAR(100),
    mandal VARCHAR(100),
    disease VARCHAR(100),
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    acknowledged_by VARCHAR(36),
    created_at TIMESTAMP_TZ DEFAULT CURRENT_TIMESTAMP(),
    updated_at TIMESTAMP_TZ DEFAULT CURRENT_TIMESTAMP()
);

-- 5. ANALYTICS SNAPSHOTS
CREATE OR REPLACE TABLE ANALYTICS_SNAPSHOTS (
    id VARCHAR(36) DEFAULT UUID_STRING() PRIMARY KEY,
    snapshot_date DATE NOT NULL,
    district VARCHAR(100) NOT NULL,
    disease VARCHAR(100),
    crop VARCHAR(100),
    new_cases NUMBER(38,0) DEFAULT 0,
    total_cases NUMBER(38,0) DEFAULT 0,
    trend VARCHAR(20) DEFAULT 'stable',
    predicted_cases NUMBER(38,0),
    risk_score FLOAT DEFAULT 0.0,
    created_at TIMESTAMP_TZ DEFAULT CURRENT_TIMESTAMP()
);

-- ==========================================
-- REALISTIC MOCK DATA SEEDING
-- ==========================================

-- Clean up existing data for fresh seed
TRUNCATE TABLE DISEASE_REPORTS;
TRUNCATE TABLE INVENTORY;
TRUNCATE TABLE ALERTS;
TRUNCATE TABLE ANALYTICS_SNAPSHOTS;

-- DISEASE_REPORTS: Realistic clusters of crop diseases in Telangana/AP
INSERT INTO DISEASE_REPORTS (district, mandal, crop, disease, cases, severity, trend, trend_pct, latitude, longitude) VALUES
('Warangal', 'Hanamkonda', 'Cotton', 'Pink Bollworm', 342, 'critical', 'rising', 45.2, 17.9689, 79.5941),
('Warangal', 'Parkal', 'Cotton', 'Pink Bollworm', 128, 'high', 'rising', 22.0, 18.1947, 79.8436),
('Khammam', 'Wyra', 'Chilli', 'Leaf Curl Virus', 415, 'critical', 'rising', 38.5, 17.2473, 80.1514),
('Khammam', 'Sathupalli', 'Chilli', 'Leaf Curl Virus', 189, 'high', 'rising', 15.0, 17.2140, 80.8251),
('Karimnagar', 'Jammikunta', 'Rice', 'Blast Disease', 210, 'medium', 'stable', 2.1, 18.4386, 79.1288),
('Karimnagar', 'Huzurabad', 'Rice', 'Blast Disease', 85, 'low', 'falling', -12.4, 18.2045, 79.4042),
('Nalgonda', 'Miryalaguda', 'Rice', 'Brown Spot', 112, 'medium', 'rising', 8.4, 16.8741, 79.5701),
('Nizamabad', 'Armoor', 'Maize', 'Fall Armyworm', 276, 'high', 'rising', 18.7, 18.7845, 78.2863),
('Adilabad', 'Utnoor', 'Cotton', 'Boll Rot', 94, 'medium', 'stable', 0.5, 19.3626, 78.7801),
('Mahabubnagar', 'Jadcherla', 'Groundnut', 'Tikka Disease', 156, 'high', 'rising', 12.0, 16.7621, 78.1408),
('Siddipet', 'Gajwel', 'Tomato', 'Early Blight', 189, 'high', 'rising', 19.2, 17.8540, 78.6811);


-- INVENTORY: Agrochemicals matching the diseases above
INSERT INTO INVENTORY (product, district, mandal, urgency, stock_units, estimated_demand, confidence) VALUES
('Emamectin Benzoate 5% SG', 'Warangal', 'Hanamkonda', 'CRITICAL', 120, 1500, 0.92),
('Spinosad 45% SC', 'Warangal', 'Parkal', 'HIGH', 340, 800, 0.88),
('Imidacloprid 17.8% SL', 'Khammam', 'Wyra', 'CRITICAL', 50, 2100, 0.95),
('Tricyclazole 75% WP', 'Karimnagar', 'Jammikunta', 'MEDIUM', 850, 900, 0.75),
('Chlorantraniliprole', 'Nizamabad', 'Armoor', 'HIGH', 200, 1200, 0.89),
('Mancozeb 75% WP', 'Siddipet', 'Gajwel', 'HIGH', 150, 1000, 0.82),
('Chlorothalonil', 'Mahabubnagar', 'Jadcherla', 'MEDIUM', 400, 500, 0.80);


-- ALERTS: Automated system warnings
INSERT INTO ALERTS (severity, title, message, district, mandal, disease, is_read) VALUES
('critical', 'Severe Pink Bollworm Outbreak', 'Cases in Warangal have surged by 45% in the last 72 hours. Immediate inventory dispatch required.', 'Warangal', 'Hanamkonda', 'Pink Bollworm', FALSE),
('critical', 'Chilli Leaf Curl Virus Spreading', 'High transmission rate detected across Khammam district. Over 400 new cases logged this week.', 'Khammam', 'Wyra', 'Leaf Curl Virus', FALSE),
('high', 'Fall Armyworm Surge', 'Maize crops in Nizamabad showing 18% increase in armyworm reports.', 'Nizamabad', 'Armoor', 'Fall Armyworm', FALSE),
('medium', 'Inventory Shortage Predicted', 'Current stocks of Emamectin Benzoate in Warangal will deplete in 2 days based on current scan rates.', 'Warangal', NULL, NULL, FALSE);


-- ANALYTICS_SNAPSHOTS: 7 days of historical trend data for charts
INSERT INTO ANALYTICS_SNAPSHOTS (snapshot_date, district, disease, crop, new_cases, total_cases, trend, predicted_cases, risk_score) VALUES
-- Warangal Pink Bollworm trend (Historical)
(DATEADD(day, -7, CURRENT_DATE()), 'Warangal', 'Pink Bollworm', 'Cotton', 12, 140, 'stable', 150, 65.5),
(DATEADD(day, -6, CURRENT_DATE()), 'Warangal', 'Pink Bollworm', 'Cotton', 18, 158, 'rising', 170, 68.2),
(DATEADD(day, -5, CURRENT_DATE()), 'Warangal', 'Pink Bollworm', 'Cotton', 35, 193, 'rising', 200, 72.0),
(DATEADD(day, -4, CURRENT_DATE()), 'Warangal', 'Pink Bollworm', 'Cotton', 42, 235, 'rising', 250, 78.5),
(DATEADD(day, -3, CURRENT_DATE()), 'Warangal', 'Pink Bollworm', 'Cotton', 58, 293, 'rising', 310, 85.0),
(DATEADD(day, -2, CURRENT_DATE()), 'Warangal', 'Pink Bollworm', 'Cotton', 74, 367, 'rising', 380, 91.5),
(DATEADD(day, -1, CURRENT_DATE()), 'Warangal', 'Pink Bollworm', 'Cotton', 103, 470, 'rising', 490, 95.8),
-- Predictive points (Future)
(CURRENT_DATE(), 'Warangal', 'Pink Bollworm', 'Cotton', NULL, NULL, 'rising', 610, 97.0),
(DATEADD(day, 1, CURRENT_DATE()), 'Warangal', 'Pink Bollworm', 'Cotton', NULL, NULL, 'rising', 740, 98.5),
(DATEADD(day, 2, CURRENT_DATE()), 'Warangal', 'Pink Bollworm', 'Cotton', NULL, NULL, 'rising', 890, 99.0),

-- Khammam Leaf Curl (Historical)
(DATEADD(day, -7, CURRENT_DATE()), 'Khammam', 'Leaf Curl Virus', 'Chilli', 45, 300, 'rising', 310, 75.0),
(DATEADD(day, -4, CURRENT_DATE()), 'Khammam', 'Leaf Curl Virus', 'Chilli', 60, 480, 'rising', 500, 82.0),
(DATEADD(day, -1, CURRENT_DATE()), 'Khammam', 'Leaf Curl Virus', 'Chilli', 85, 604, 'rising', 620, 89.5),
(CURRENT_DATE(), 'Khammam', 'Leaf Curl Virus', 'Chilli', NULL, NULL, 'rising', 710, 92.0),

-- Karimnagar Blast (Historical - Stable)
(DATEADD(day, -7, CURRENT_DATE()), 'Karimnagar', 'Blast Disease', 'Rice', 5, 280, 'stable', 285, 45.0),
(DATEADD(day, -4, CURRENT_DATE()), 'Karimnagar', 'Blast Disease', 'Rice', 6, 290, 'stable', 295, 45.0),
(DATEADD(day, -1, CURRENT_DATE()), 'Karimnagar', 'Blast Disease', 'Rice', 5, 295, 'stable', 300, 44.5),
(CURRENT_DATE(), 'Karimnagar', 'Blast Disease', 'Rice', NULL, NULL, 'stable', 305, 44.0);
