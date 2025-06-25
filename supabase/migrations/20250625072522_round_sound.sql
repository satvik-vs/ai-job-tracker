/*
  # Fix AI Generations Table for OpenRouter Integration

  1. Changes
    - Add request_id column to ai_generations table
    - Make job_application_id nullable for direct OpenRouter responses
    - Update RLS policies to handle special patterns
    - Add performance indexes

  2. Security
    - Update RLS policies to allow access to AI generations
    - Support both linked and unlinked AI generations
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

-- Make job_application_id nullable to support direct OpenRouter responses
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

-- Create new flexible policies for AI generations with proper UUID handling
CREATE POLICY "Users can read AI generations"
  ON ai_generations
  FOR SELECT
  TO authenticated
  USING (
    -- Allow if linked to user's job application
    (job_application_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM job_applications 
      WHERE job_applications.id = ai_generations.job_application_id 
      AND job_applications.user_id = auth.uid()
    ))
    OR
    -- Allow if no job application linked (direct responses)
    job_application_id IS NULL
    OR
    -- Allow if job_application_id is a special pattern (cast to text for pattern matching)
    (job_application_id IS NOT NULL AND 
     job_application_id::text LIKE 'openrouter-%')
    OR
    (job_application_id IS NOT NULL AND 
     job_application_id::text LIKE 'direct-%')
    OR
    (job_application_id IS NOT NULL AND 
     job_application_id::text LIKE 'error-%')
  );

CREATE POLICY "Users can insert AI generations"
  ON ai_generations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow if linked to user's job application
    (job_application_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM job_applications 
      WHERE job_applications.id = ai_generations.job_application_id 
      AND job_applications.user_id = auth.uid()
    ))
    OR
    -- Allow if no job application linked (direct responses)
    job_application_id IS NULL
    OR
    -- Allow if job_application_id is a special pattern (cast to text for pattern matching)
    (job_application_id IS NOT NULL AND 
     job_application_id::text LIKE 'openrouter-%')
    OR
    (job_application_id IS NOT NULL AND 
     job_application_id::text LIKE 'direct-%')
    OR
    (job_application_id IS NOT NULL AND 
     job_application_id::text LIKE 'error-%')
  );

CREATE POLICY "Users can update AI generations"
  ON ai_generations
  FOR UPDATE
  TO authenticated
  USING (
    -- Allow if linked to user's job application
    (job_application_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM job_applications 
      WHERE job_applications.id = ai_generations.job_application_id 
      AND job_applications.user_id = auth.uid()
    ))
    OR
    -- Allow if no job application linked (direct responses)
    job_application_id IS NULL
    OR
    -- Allow if job_application_id is a special pattern (cast to text for pattern matching)
    (job_application_id IS NOT NULL AND 
     job_application_id::text LIKE 'openrouter-%')
    OR
    (job_application_id IS NOT NULL AND 
     job_application_id::text LIKE 'direct-%')
    OR
    (job_application_id IS NOT NULL AND 
     job_application_id::text LIKE 'error-%')
  );

CREATE POLICY "Users can delete AI generations"
  ON ai_generations
  FOR DELETE
  TO authenticated
  USING (
    -- Allow if linked to user's job application
    (job_application_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM job_applications 
      WHERE job_applications.id = ai_generations.job_application_id 
      AND job_applications.user_id = auth.uid()
    ))
    OR
    -- Allow if no job application linked (direct responses)
    job_application_id IS NULL
    OR
    -- Allow if job_application_id is a special pattern (cast to text for pattern matching)
    (job_application_id IS NOT NULL AND 
     job_application_id::text LIKE 'openrouter-%')
    OR
    (job_application_id IS NOT NULL AND 
     job_application_id::text LIKE 'direct-%')
    OR
    (job_application_id IS NOT NULL AND 
     job_application_id::text LIKE 'error-%')
  );

-- Insert a test record to verify the setup works
INSERT INTO ai_generations (
  request_id,
  type,
  content,
  job_application_id,
  is_used
) VALUES (
  'test-openrouter-' || extract(epoch from now()),
  'resume',
  'Test OpenRouter AI generation content for verification',
  'openrouter-test-' || extract(epoch from now()),
  false
) ON CONFLICT DO NOTHING;