/*
  # Fix AI Generations Table for OpenRouter Integration

  1. Changes
    - Ensure request_id column exists
    - Make job_application_id nullable
    - Update RLS policies to handle special UUID patterns
    - Add proper indexes for performance
    
  2. Security
    - Create flexible RLS policies for AI generations
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
    (
      -- Allow if linked to user's job application
      (job_application_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM job_applications 
        WHERE job_applications.id = ai_generations.job_application_id 
        AND job_applications.user_id = auth.uid()
      ))
      OR
      -- Allow if no job application linked (direct responses)
      job_application_id IS NULL
    )
  );

CREATE POLICY "Users can insert AI generations"
  ON ai_generations
  FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);

CREATE POLICY "Users can update AI generations"
  ON ai_generations
  FOR UPDATE
  TO authenticated
  USING (
    (
      -- Allow if linked to user's job application
      (job_application_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM job_applications 
        WHERE job_applications.id = ai_generations.job_application_id 
        AND job_applications.user_id = auth.uid()
      ))
      OR
      -- Allow if no job application linked (direct responses)
      job_application_id IS NULL
    )
  );

CREATE POLICY "Users can delete AI generations"
  ON ai_generations
  FOR DELETE
  TO authenticated
  USING (
    (
      -- Allow if linked to user's job application
      (job_application_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM job_applications 
        WHERE job_applications.id = ai_generations.job_application_id 
        AND job_applications.user_id = auth.uid()
      ))
      OR
      -- Allow if no job application linked (direct responses)
      job_application_id IS NULL
    )
  );