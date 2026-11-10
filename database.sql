-- جدول المستخدمين
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول الجمعيات (بكل الأعمدة الاحترافية والجديدة)
CREATE TABLE IF NOT EXISTS gamayas (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    total_months INT NOT NULL,
    start_date DATE,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول ربط الأعضاء بالجمعيات وأدوارهم (مع دعم الأسهم المرنة)
CREATE TABLE IF NOT EXISTS gamaya_members (
    id SERIAL PRIMARY KEY,
    gamaya_id INT REFERENCES gamayas(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    turn_number INT NOT NULL,
    share_fraction NUMERIC(3, 2) DEFAULT 1.0,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);