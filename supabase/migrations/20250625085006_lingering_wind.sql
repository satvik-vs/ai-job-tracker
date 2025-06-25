/*
  # AI Generations Table Updates for Gemini Integration

  1. Changes
    - Add request_id column for tracking AI generation requests
    - Make job_application_id nullable to support direct AI responses
    - Add performance indexes
    - Update RLS policies for broader access

  2. Security
    - Enable RLS with simplified policies
    - Allow authenticated users to manage AI generations
*/

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

-- Make job_application_id nullable if it's currently NOT NULL
DO $$
BEGIN
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
CREATE INDEX IF NOT EXISTS idx_ai_generations_usage ON ai_generations(job_application_id, is_used, generated_on DESC);

-- Ensure RLS is enabled
ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;

-- Create new simplified policies (these will replace any existing ones)
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can read AI generations for their job applications" ON ai_generations;
  DROP POLICY IF EXISTS "Users can insert AI generations for their job applications" ON ai_generations;
  DROP POLICY IF EXISTS "Users can update AI generations for their job applications" ON ai_generations;
  DROP POLICY IF EXISTS "Users can delete AI generations for their job applications" ON ai_generations;
  DROP POLICY IF EXISTS "Users can select AI generations" ON ai_generations;
  DROP POLICY IF EXISTS "Users can insert AI generations" ON ai_generations;
  DROP POLICY IF EXISTS "Users can update AI generations" ON ai_generations;
  DROP POLICY IF EXISTS "Users can delete AI generations" ON ai_generations;

  -- Create new policies
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
END $$;