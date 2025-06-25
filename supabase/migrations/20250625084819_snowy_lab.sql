/*
  # Fix AI Generations Table for Gemini Integration

  1. Changes
    - Add request_id column if it doesn't exist
    - Make job_application_id nullable for direct AI responses
    - Create indexes for better performance
    - Update RLS policies for proper access

  2. Security
    - Enable RLS on ai_generations table
    - Create policies for authenticated users
*/

-- Add request_id column if it doesn't exist
ALTER TABLE ai_generations ADD COLUMN IF NOT EXISTS request_id text;

-- Make job_application_id nullable
ALTER TABLE ai_generations ALTER COLUMN job_application_id DROP NOT NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_generations_request_id ON ai_generations(request_id);
CREATE INDEX IF NOT EXISTS idx_ai_generations_type_generated ON ai_generations(type, generated_on DESC);
CREATE INDEX IF NOT EXISTS idx_ai_generations_usage ON ai_generations(job_application_id, is_used, generated_on DESC);

-- Enable RLS on ai_generations table
ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read AI generations for their job applications" ON ai_generations;
DROP POLICY IF EXISTS "Users can insert AI generations for their job applications" ON ai_generations;
DROP POLICY IF EXISTS "Users can update AI generations for their job applications" ON ai_generations;
DROP POLICY IF EXISTS "Users can delete AI generations for their job applications" ON ai_generations;
DROP POLICY IF EXISTS "Users can select AI generations" ON ai_generations;
DROP POLICY IF EXISTS "Users can insert AI generations" ON ai_generations;
DROP POLICY IF EXISTS "Users can update AI generations" ON ai_generations;
DROP POLICY IF EXISTS "Users can delete AI generations" ON ai_generations;

-- Create new policies for AI generations
CREATE POLICY "Users can select AI generations"
  ON ai_generations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert AI generations"
  ON ai_generations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update AI generations"
  ON ai_generations
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete AI generations"
  ON ai_generations
  FOR DELETE
  TO authenticated
  USING (true);