CREATE TABLE IF NOT EXISTS mails (
  id SERIAL PRIMARY KEY,
  from_email VARCHAR(255),
  to_email VARCHAR(255),
  subject TEXT,
  body TEXT,
  date TIMESTAMP DEFAULT NOW()
);