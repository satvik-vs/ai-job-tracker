/*
  # Fix AI Generations Table

  1. Changes
    - Make job_application_id nullable
    - Add request_id column
    - Create indexes for better performance
    - Enable RLS with simple policies
*/

-- Make job_application_id nullable
ALTER TABLE ai_generations ALTER COLUMN job_application_id DROP NOT NULL;

-- Add request_id column if it doesn't exist
ALTER TABLE ai_generations ADD COLUMN IF NOT EXISTS request_id text;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_generations_request_id ON ai_generations(request_id);
CREATE INDEX IF NOT EXISTS idx_ai_generations_type_generated ON ai_generations(type, generated_on DESC);

-- Enable RLS on ai_generations table
ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;

-- Create simple policies for AI generations
CREATE POLICY "Users can select AI generations"
  ON ai_generations
  FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Users can insert AI generations"
  ON ai_generations
  FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);

CREATE POLICY "Users can update AI generations"
  ON ai_generations
  FOR UPDATE
  TO authenticated
  USING (TRUE);

CREATE POLICY "Users can delete AI generations"
  ON ai_generations
  FOR DELETE
  TO authenticated
  USING (TRUE);