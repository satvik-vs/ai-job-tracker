/*
  # Fix n8n Integration and Database Constraints

  1. Changes
    - Create n8n_generations tables if they don't exist
    - Fix unique constraint issues by using ON CONFLICT DO NOTHING
    - Ensure proper RLS policies for authenticated users
    - Add proper job_id handling for both application and linkedin jobs
    
  2. Security
    - Enable RLS on all tables
    - Create policies for authenticated users
*/

-- Create n8n_generations_resume table if it doesn't exist
CREATE TABLE IF NOT EXISTS n8n_generations_resume (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES linkedin_jobs(id) ON DELETE SET NULL,
  job_type text DEFAULT 'linkedin' CHECK (job_type IN ('application', 'linkedin')),
  company_name text NOT NULL,
  job_title text NOT NULL,
  job_description text,
  ats_score integer DEFAULT 0,
  keywords text[] DEFAULT '{}',
  suggestions_count integer DEFAULT 0,
  content text NOT NULL,
  notes text,
  request_id text,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create n8n_generations_cover_letter table if it doesn't exist
CREATE TABLE IF NOT EXISTS n8n_generations_cover_letter (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES linkedin_jobs(id) ON DELETE SET NULL,
  job_type text DEFAULT 'linkedin' CHECK (job_type IN ('application', 'linkedin')),
  company_name text NOT NULL,
  job_title text NOT NULL,
  job_description text,
  content text NOT NULL,
  tone text DEFAULT 'professional',
  keywords text[] DEFAULT '{}',
  personalization_score integer DEFAULT 0,
  word_count integer DEFAULT 0,
  request_id text,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Remove unique constraints if they exist to avoid conflicts
DO $$
BEGIN
  -- Drop unique constraint on n8n_generations_resume if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'n8n_generations_resume_job_id_key' 
    AND conrelid = 'n8n_generations_resume'::regclass
  ) THEN
    ALTER TABLE n8n_generations_resume DROP CONSTRAINT n8n_generations_resume_job_id_key;
  END IF;
  
  -- Drop unique constraint on n8n_generations_cover_letter if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'n8n_generations_cover_letter_job_id_key' 
    AND conrelid = 'n8n_generations_cover_letter'::regclass
  ) THEN
    ALTER TABLE n8n_generations_cover_letter DROP CONSTRAINT n8n_generations_cover_letter_job_id_key;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_n8n_resume_job_id ON n8n_generations_resume(job_id);
CREATE INDEX IF NOT EXISTS idx_n8n_resume_user_id ON n8n_generations_resume(user_id);
CREATE INDEX IF NOT EXISTS idx_n8n_resume_request_id ON n8n_generations_resume(request_id);
CREATE INDEX IF NOT EXISTS idx_n8n_resume_created_at ON n8n_generations_resume(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_n8n_cover_job_id ON n8n_generations_cover_letter(job_id);
CREATE INDEX IF NOT EXISTS idx_n8n_cover_user_id ON n8n_generations_cover_letter(user_id);
CREATE INDEX IF NOT EXISTS idx_n8n_cover_request_id ON n8n_generations_cover_letter(request_id);
CREATE INDEX IF NOT EXISTS idx_n8n_cover_created_at ON n8n_generations_cover_letter(created_at DESC);

-- Enable RLS on both tables
ALTER TABLE n8n_generations_resume ENABLE ROW LEVEL SECURITY;
ALTER TABLE n8n_generations_cover_letter ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop policies for n8n_generations_resume
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'n8n_generations_resume') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON n8n_generations_resume';
    END LOOP;
    
    -- Drop policies for n8n_generations_cover_letter
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'n8n_generations_cover_letter') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON n8n_generations_cover_letter';
    END LOOP;
END $$;

-- Create RLS policies for n8n_generations_resume
CREATE POLICY "Users can read own resume generations"
  ON n8n_generations_resume
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own resume generations"
  ON n8n_generations_resume
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own resume generations"
  ON n8n_generations_resume
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own resume generations"
  ON n8n_generations_resume
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for n8n_generations_cover_letter
CREATE POLICY "Users can read own cover letter generations"
  ON n8n_generations_cover_letter
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cover letter generations"
  ON n8n_generations_cover_letter
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cover letter generations"
  ON n8n_generations_cover_letter
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cover letter generations"
  ON n8n_generations_cover_letter
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);