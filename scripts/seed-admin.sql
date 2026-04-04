-- Check if admin user exists, if not create one
-- Password is bcrypt hash of 'dcc2020'
INSERT INTO users (username, password, role)
SELECT 'dynamic', '$2a$10$rqJZVVVz.hEIz4dRZ0xQMOqRSMCJI7zQz3j.7xLZGYmL2zT7JxO.m', 'admin'
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE username = 'dynamic'
);
