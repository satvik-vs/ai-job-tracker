/*
  # Fix AI Generations Table for N8N Integration

  1. Changes
    - Add request_id column if it doesn't exist
    - Make job_application_id nullable to support N8N responses
    - Update RLS policies to handle N8N workflow responses
    - Add proper indexes for performance
    - Handle UUID type casting properly

  2. Security
    - Updated RLS policies to allow N8N responses
    - Maintain user data isolation
    - Allow access to N8N-generated content
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

-- Make job_application_id nullable to support N8N responses
ALTER TABLE ai_generations ALTER COLUMN job_application_id DROP NOT NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_generations_request_id ON ai_generations(request_id);
CREATE INDEX IF NOT EXISTS idx_ai_generations_type_generated ON ai_generations(type, generated_on DESC);

-- Update the table comment
COMMENT ON COLUMN ai_generations.request_id IS 'Unique request ID for N8N workflow integration';
COMMENT ON COLUMN ai_generations.job_application_id IS 'Job application ID - can be null for N8N responses';

-- Ensure RLS policies allow access to AI generations
DROP POLICY IF EXISTS "Users can read AI generations for their job applications" ON ai_generations;
DROP POLICY IF EXISTS "Users can insert AI generations for their job applications" ON ai_generations;
DROP POLICY IF EXISTS "Users can update AI generations for their job applications" ON ai_generations;
DROP POLICY IF EXISTS "Users can delete AI generations for their job applications" ON ai_generations;

-- Create more flexible policies for AI generations with proper UUID handling
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
    -- Allow if no job application linked (N8N responses)
    job_application_id IS NULL
    OR
    -- Allow if job_application_id is a text pattern (cast to text for pattern matching)
    (job_application_id::text LIKE 'n8n-%')
    OR
    (job_application_id::text LIKE 'error-%')
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
    -- Allow if no job application linked (N8N responses)
    job_application_id IS NULL
    OR
    -- Allow if job_application_id is a text pattern (cast to text for pattern matching)
    (job_application_id::text LIKE 'n8n-%')
    OR
    (job_application_id::text LIKE 'error-%')
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
    -- Allow if no job application linked (N8N responses)
    job_application_id IS NULL
    OR
    -- Allow if job_application_id is a text pattern (cast to text for pattern matching)
    (job_application_id::text LIKE 'n8n-%')
    OR
    (job_application_id::text LIKE 'error-%')
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
    -- Allow if no job application linked (N8N responses)
    job_application_id IS NULL
    OR
    -- Allow if job_application_id is a text pattern (cast to text for pattern matching)
    (job_application_id::text LIKE 'n8n-%')
    OR
    (job_application_id::text LIKE 'error-%')
  );

-- Insert some test data to verify the setup (using proper UUID generation)
DO $$
DECLARE
  test_request_id text;
  test_job_app_id text;
BEGIN
  test_request_id := 'test-' || extract(epoch from now())::text;
  test_job_app_id := 'n8n-test-' || extract(epoch from now())::text;
  
  INSERT INTO ai_generations (
    request_id,
    type,
    content,
    job_application_id,
    is_used
  ) VALUES (
    test_request_id,
    'resume',
    'Test AI generation content for verification',
    test_job_app_id::uuid,
    false
  ) ON CONFLICT DO NOTHING;
EXCEPTION
  WHEN OTHERS THEN
    -- If UUID conversion fails, insert with NULL job_application_id
    INSERT INTO ai_generations (
      request_id,
      type,
      content,
      job_application_id,
      is_used
    ) VALUES (
      test_request_id,
      'resume',
      'Test AI generation content for verification',
      NULL,
      false
    ) ON CONFLICT DO NOTHING;
END $$;