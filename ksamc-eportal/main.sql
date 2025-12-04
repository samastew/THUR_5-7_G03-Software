-- KSAMC E-Portal Database Schema
-- System Requirement: 6.1 - Centralized document repository

-- Create database
CREATE DATABASE IF NOT EXISTS ksamc_portal;
USE ksamc_portal;

-- Users table - System Requirement: 5.1 - Role-Based Access Control
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('client', 'admin', 'reviewer', 'manager') DEFAULT 'client',
    phone VARCHAR(20),
    company VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Applications table - System Requirement: 1.1 - Building Status Management
CREATE TABLE applications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tracking_number VARCHAR(20) UNIQUE NOT NULL,
    applicant_id INT NOT NULL,
    project_name VARCHAR(200) NOT NULL,
    property_address TEXT NOT NULL,
    project_type ENUM('residential', 'commercial', 'industrial', 'institutional') DEFAULT 'residential',
    description TEXT,
    status ENUM('received', 'under_review', 'additional_info_required', 'approved', 'rejected') DEFAULT 'received',
    assigned_to INT,
    submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (applicant_id) REFERENCES users(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id)
);

-- Documents table - System Requirement: 2.1 - Document Upload
CREATE TABLE documents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    application_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(10) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
);

-- Status history - System Requirement: 3.3 - Status change log
CREATE TABLE status_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    application_id INT NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by INT,
    notes TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES applications(id),
    FOREIGN KEY (changed_by) REFERENCES users(id)
);

-- Notifications - System Requirement: 4.1 - Automated notifications
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    application_id INT NOT NULL,
    recipient_email VARCHAR(100) NOT NULL,
    subject VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES applications(id)
);

--NEW SHADELLE
-- Add a test application for document upload testing
INSERT INTO applications (tracking_number, applicant_id, project_name, property_address, project_type) 
VALUES ('KSAMC-TEST-001', 1, 'Test Project', '123 Test Street', 'residential');
--END SHADELLE CODE

-- Insert default users for testing
INSERT INTO users (username, email, password, full_name, role) VALUES
('admin', 'stewartsamara24@gmail.com', '$2y$10$TestHashForDemo', 'System Admin', 'manager'),
('reviewer1', 'stewartamelia822@gmail.com', '$2y$10$TestHashForDemo', 'Review Officer', 'reviewer'),
('clerk1', 'samastew93@gmail.com', '$2y$10$TestHashForDemo', 'Admin Clerk', 'admin');