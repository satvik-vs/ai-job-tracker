/*
  # Create N8N Generations Cover Letter Table

  1. New Tables
    - `n8n_generations_cover_letter` - Stores cover letter generation results from N8N workflow
      - `id` (uuid, primary key)
      - `job_id` (uuid, references job_applications or linkedin_jobs)
      - `job_type` (text, either 'application' or 'linkedin')
      - `company_name` (text)
      - `job_title` (text)
      - `content` (text) - The generated cover letter
      - `tone` (text) - The tone used for generation
      - `personalization_score` (integer) - How personalized the letter is (0-100)
      - `word_count` (integer) - Number of words in the letter
      - `created_at` (timestamp)
      - `request_id` (text) - Unique ID for tracking N8N requests
      - `user_id` (uuid, references profiles)

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Create n8n_generations_cover_letter table
CREATE TABLE IF NOT EXISTS n8n_generations_cover_letter (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid,
  job_type text NOT NULL CHECK (job_type IN ('application', 'linkedin')),
  company_name text NOT NULL,
  job_title text NOT NULL,
  content text NOT NULL,
  tone text DEFAULT 'professional',
  personalization_score integer DEFAULT 0,
  word_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  request_id text,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_n8n_generations_cover_letter_job_id ON n8n_generations_cover_letter(job_id);
CREATE INDEX IF NOT EXISTS idx_n8n_generations_cover_letter_user_id ON n8n_generations_cover_letter(user_id);
CREATE INDEX IF NOT EXISTS idx_n8n_generations_cover_letter_request_id ON n8n_generations_cover_letter(request_id);
CREATE INDEX IF NOT EXISTS idx_n8n_generations_cover_letter_created_at ON n8n_generations_cover_letter(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_n8n_generations_cover_letter_tone ON n8n_generations_cover_letter(tone);

-- Enable RLS
ALTER TABLE n8n_generations_cover_letter ENABLE ROW LEVEL SECURITY;

-- Create policies
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

-- Add sample data for testing
INSERT INTO n8n_generations_cover_letter (
  job_type,
  company_name,
  job_title,
  content,
  tone,
  personalization_score,
  word_count,
  user_id,
  request_id
) VALUES (
  'application',
  'Example Corp',
  'Software Engineer',
  'Dear Hiring Manager,

I am writing to express my strong interest in the Software Engineer position at Example Corp. With my background in full-stack development and experience with JavaScript, React, and Node.js, I believe I would be a valuable addition to your team.

Throughout my career, I have focused on building scalable web applications and solving complex technical challenges. My experience includes developing RESTful APIs, implementing responsive user interfaces, and optimizing application performance. I am particularly drawn to Example Corp''s innovative approach to technology solutions and commitment to quality.

I am excited about the opportunity to contribute to your team and help drive the success of your projects. My collaborative work style and problem-solving mindset would make me a great fit for your company culture.

Thank you for considering my application. I look forward to the possibility of discussing how my skills and experience align with your needs.

Best regards,
[Your Name]',
  'professional',
  85,
  180,
  '00000000-0000-0000-0000-000000000000',
  'test-n8n-request-456'
);