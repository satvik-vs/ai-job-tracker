/*
  # Create or Update AI Generations Table

  1. New Tables (if not exists)
    - `ai_generations`
      - `id` (uuid, primary key)
      - `job_application_id` (uuid, nullable, references job_applications)
      - `type` (text, check constraint for 'resume' or 'cover-letter')
      - `content` (text)
      - `generated_on` (timestamp)
      - `is_used` (boolean)
      - `request_id` (text, for n8n workflow integration)

  2. Security
    - Enable RLS on ai_generations table
    - Add policies for authenticated users
*/

-- Create ai_generations table if it doesn't exist
CREATE TABLE IF NOT EXISTS ai_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_application_id uuid REFERENCES job_applications(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('resume', 'cover-letter')),
  content text NOT NULL,
  generated_on timestamptz DEFAULT now(),
  is_used boolean DEFAULT false,
  request_id text
);

-- Make job_application_id nullable if it's not already
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

-- Create indexes for better performance if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_ai_generations_request_id'
  ) THEN
    CREATE INDEX idx_ai_generations_request_id ON ai_generations(request_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_ai_generations_type_generated'
  ) THEN
    CREATE INDEX idx_ai_generations_type_generated ON ai_generations(type, generated_on DESC);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_ai_generations_job_application_id'
  ) THEN
    CREATE INDEX idx_ai_generations_job_application_id ON ai_generations(job_application_id);
  END IF;
END $$;

-- Enable RLS on ai_generations table
ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to avoid conflicts
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'ai_generations') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ai_generations';
    END LOOP;
END $$;

-- Create new policies with unique names
CREATE POLICY "ai_generations_select_policy" 
  ON ai_generations
  FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "ai_generations_insert_policy" 
  ON ai_generations
  FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);

CREATE POLICY "ai_generations_update_policy" 
  ON ai_generations
  FOR UPDATE
  TO authenticated
  USING (TRUE);

CREATE POLICY "ai_generations_delete_policy" 
  ON ai_generations
  FOR DELETE
  TO authenticated
  USING (TRUE);

-- Add comments to document the changes
COMMENT ON TABLE ai_generations IS 'AI-generated content for resumes and cover letters';
COMMENT ON COLUMN ai_generations.request_id IS 'Unique request ID for n8n workflow integration';
COMMENT ON COLUMN ai_generations.job_application_id IS 'Job application ID - can be null for n8n workflow responses';
COMMENT ON COLUMN ai_generations.type IS 'Type of generation: resume or cover-letter';
COMMENT ON COLUMN ai_generations.content IS 'Generated content from AI';
COMMENT ON COLUMN ai_generations.is_used IS 'Whether this generation has been used by the user';