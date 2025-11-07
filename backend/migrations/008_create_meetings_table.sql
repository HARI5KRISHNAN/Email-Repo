-- Create meetings table for calendar functionality
CREATE TABLE IF NOT EXISTS meetings (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  location VARCHAR(500),
  organizer VARCHAR(255) NOT NULL,
  attendees TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on organizer for faster lookups
CREATE INDEX IF NOT EXISTS idx_meetings_organizer ON meetings(organizer);

-- Create index on start_time for sorting
CREATE INDEX IF NOT EXISTS idx_meetings_start_time ON meetings(start_time);

-- Create GIN index on attendees array for faster array searches
CREATE INDEX IF NOT EXISTS idx_meetings_attendees ON meetings USING GIN(attendees);
