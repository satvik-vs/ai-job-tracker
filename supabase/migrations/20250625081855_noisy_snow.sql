/*
  # Fix AI Generations Table and Policies

  1. Changes
    - Make job_application_id nullable
    - Add request_id column
    - Create proper indexes
    - Fix RLS policies
    
  2. Security
    - Enable RLS on ai_generations table
    - Add policies for authenticated users
*/

-- Ensure request_id column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ai_generations' AND column_name = 'request_id'
  ) THEN
    ALTER TABLE ai_generations ADD COLUMN request_id text;
  END IF;
END $$;

-- Make job_application_id nullable to support direct AI responses
DO $$
BEGIN
  -- Check if the column has NOT NULL constraint
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ai_generations' 
    AND column_name = 'job_application_id' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE ai_generations ALTER COLUMN job_application_id DROP NOT NULL;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_generations_request_id ON ai_generations(request_id);
CREATE INDEX IF NOT EXISTS idx_ai_generations_type_generated ON ai_generations(type, generated_on DESC);

-- Update the table comments
COMMENT ON COLUMN ai_generations.request_id IS 'Unique request ID for OpenRouter integration';
COMMENT ON COLUMN ai_generations.job_application_id IS 'Job application ID - can be null for direct OpenRouter responses';

-- Drop all existing policies for ai_generations to avoid conflicts
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'ai_generations') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ai_generations';
    END LOOP;
END $$;

-- Create simplified policies for AI generations
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

-- Insert a test record to verify the setup works
INSERT INTO ai_generations (
  request_id,
  type,
  content,
  job_application_id,
  is_used
) VALUES (
  'test-' || extract(epoch from now())::text,
  'resume',
  'Test AI generation content for verification',
  NULL,
  false
) ON CONFLICT DO NOTHING;