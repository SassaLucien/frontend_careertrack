-- Base de données CareerTracker
CREATE DATABASE carreertrack;

\c carreertrack;

-- Table des utilisateurs
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    profile_photo VARCHAR(500),
    role VARCHAR(20) CHECK (role IN ('STUDENT', 'TEACHER', 'COMPANY')) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des étudiants
CREATE TABLE Students (
    id BIGINT PRIMARY KEY,
    user_id BIGINT,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    university VARCHAR(255),
    graduation_year VARCHAR(20),
    skills TEXT,
    profile_photo VARCHAR(500),
    password_hash VARCHAR(255),
    email VARCHAR(255),
    diploma_level VARCHAR(50),
    diploma_image VARCHAR(500),
    is_featured BOOLEAN DEFAULT false,
    featured_until DATE
);

-- Table des enseignants/professeurs
CREATE TABLE teachers (
    id BIGINT PRIMARY KEY,
    user_id BIGINT,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    department VARCHAR(255),
    subject VARCHAR(255),
    experience INTEGER,
    profile_photo VARCHAR(500),
    password_hash VARCHAR(255),
    email VARCHAR(255),
    filiere VARCHAR(255),
    is_featured BOOLEAN DEFAULT false,
    featured_until DATE
);

-- Table des entreprises
CREATE TABLE companies (
    id BIGINT PRIMARY KEY,
    user_id BIGINT,
    company_name VARCHAR(255),
    sector VARCHAR(255),
    address TEXT,
    website VARCHAR(255),
    description TEXT,
    profile_photo VARCHAR(500),
    password_hash VARCHAR(255),
    email VARCHAR(255),
    is_featured BOOLEAN DEFAULT false,
    featured_until DATE
);

-- Table des stages/offres
CREATE TABLE internships (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    requirements TEXT[],
    duration VARCHAR(100),
    location VARCHAR(255),
    image_url TEXT,
    expiration_date DATE,
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRED', 'CLOSED')),
    posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des candidatures aux stages
CREATE TABLE applications (
    id SERIAL PRIMARY KEY,
    internship_id INTEGER REFERENCES internships(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    message TEXT,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED'))
);

-- Table des evaluations journalieres des stagiaires
CREATE TABLE internship_evaluations (
    id SERIAL PRIMARY KEY,
    internship_id INTEGER NOT NULL REFERENCES internships(id) ON DELETE CASCADE,
    applicant_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    company_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    behavior_rating VARCHAR(20) CHECK (behavior_rating IN ('Excellent', 'Good', 'Average', 'Poor')),
    skills_rating VARCHAR(20) CHECK (skills_rating IN ('Excellent', 'Good', 'Average', 'Poor')),
    comment TEXT,
    evaluation_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);