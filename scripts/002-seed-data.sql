-- Insert sample data

-- Insert leave types
INSERT INTO leave_types (name, code, description, max_days_per_year, carry_forward_allowed, max_carry_forward_days, requires_document) VALUES
('Sick Leave', 'SL', 'Medical leave for illness', 12, false, 0, true),
('Casual Leave', 'CL', 'Short term personal leave', 12, true, 5, false),
('Earned Leave', 'EL', 'Annual vacation leave', 21, true, 10, false),
('Unpaid Leave', 'UL', 'Leave without pay', 30, false, 0, false),
('Maternity Leave', 'ML', 'Maternity leave for mothers', 180, false, 0, true),
('Paternity Leave', 'PL', 'Paternity leave for fathers', 15, false, 0, true);

-- Insert sample users (using simple password hash for demo - password is 'password123')
INSERT INTO users (email, password_hash, first_name, last_name, employee_id, role, department, location, hire_date) VALUES
('admin@company.com', '$2b$10$rOzJqQZQZQZQZQZQZQZQZu', 'Admin', 'User', 'EMP001', 'hr_admin', 'HR', 'New York', '2020-01-01'),
('manager1@company.com', '$2b$10$rOzJqQZQZQZQZQZQZQZQZu', 'John', 'Manager', 'EMP002', 'manager', 'Engineering', 'New York', '2020-06-01'),
('employee1@company.com', '$2b$10$rOzJqQZQZQZQZQZQZQZQZu', 'Alice', 'Smith', 'EMP003', 'employee', 'Engineering', 'New York', '2021-01-15'),
('employee2@company.com', '$2b$10$rOzJqQZQZQZQZQZQZQZQZu', 'Bob', 'Johnson', 'EMP004', 'employee', 'Engineering', 'New York', '2021-03-01');

-- Update manager relationships
UPDATE users SET manager_id = 2 WHERE id IN (3, 4);

-- Insert leave policies
INSERT INTO leave_policies (name, department, leave_type_id, max_days_per_year, accrual_rate) VALUES
('Engineering SL Policy', 'Engineering', 1, 12, 1.0),
('Engineering CL Policy', 'Engineering', 2, 12, 1.0),
('Engineering EL Policy', 'Engineering', 3, 21, 1.75);

-- Insert initial leave balances for current year
INSERT INTO leave_balances (user_id, leave_type_id, year, allocated_days, remaining_days) VALUES
(3, 1, 2024, 12, 12),
(3, 2, 2024, 12, 12),
(3, 3, 2024, 21, 21),
(4, 1, 2024, 12, 12),
(4, 2, 2024, 12, 12),
(4, 3, 2024, 21, 21);

-- Insert sample holidays
INSERT INTO holidays (name, date, location) VALUES
('New Year Day', '2024-01-01', 'New York'),
('Independence Day', '2024-07-04', 'New York'),
('Christmas Day', '2024-12-25', 'New York');
