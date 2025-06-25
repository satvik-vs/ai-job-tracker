/*
  # Fix AI Generations Table for Gemini Integration

  1. Changes
    - Make job_application_id nullable to support direct AI responses
    - Add request_id column for tracking AI generation requests
    - Create proper indexes for performance
    - Set up RLS policies safely

  2. Security
    - Enable RLS on ai_generations table
    - Create policies for authenticated users with proper conflict handling
*/

-- Make job_application_id nullable
ALTER TABLE ai_generations ALTER COLUMN job_application_id DROP NOT NULL;

-- Add request_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ai_generations' AND column_name = 'request_id'
  ) THEN
    ALTER TABLE ai_generations ADD COLUMN request_id text;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_generations_request_id ON ai_generations(request_id);
CREATE INDEX IF NOT EXISTS idx_ai_generations_type_generated ON ai_generations(type, generated_on DESC);

-- Enable RLS on ai_generations table
ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'ai_generations') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ai_generations';
    END LOOP;
END $$;

-- Create policies for AI generations
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

-- Add comment to document the changes
COMMENT ON COLUMN ai_generations.request_id IS 'Unique request ID for AI generation tracking';
COMMENT ON COLUMN ai_generations.job_application_id IS 'Job application ID - can be null for direct AI responses';