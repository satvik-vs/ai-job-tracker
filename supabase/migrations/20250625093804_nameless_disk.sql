/*
  # Create N8N Generation Tables

  1. New Tables
    - `n8n_generations_resume` - Stores resume generation results from N8N workflow
    - `n8n_generations_cover_letter` - Stores cover letter generation results from N8N workflow
    
  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Create n8n_generations_resume table
CREATE TABLE IF NOT EXISTS n8n_generations_resume (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid,
  job_type text NOT NULL CHECK (job_type IN ('application', 'linkedin')),
  company_name text NOT NULL,
  job_title text NOT NULL,
  content text NOT NULL,
  ats_score integer DEFAULT 0,
  keywords text[],
  suggestions_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  request_id text,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE
);

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
CREATE INDEX IF NOT EXISTS idx_n8n_generations_resume_job_id ON n8n_generations_resume(job_id);
CREATE INDEX IF NOT EXISTS idx_n8n_generations_resume_user_id ON n8n_generations_resume(user_id);
CREATE INDEX IF NOT EXISTS idx_n8n_generations_resume_request_id ON n8n_generations_resume(request_id);
CREATE INDEX IF NOT EXISTS idx_n8n_generations_resume_created_at ON n8n_generations_resume(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_n8n_generations_resume_keywords ON n8n_generations_resume USING gin(keywords);

CREATE INDEX IF NOT EXISTS idx_n8n_generations_cover_letter_job_id ON n8n_generations_cover_letter(job_id);
CREATE INDEX IF NOT EXISTS idx_n8n_generations_cover_letter_user_id ON n8n_generations_cover_letter(user_id);
CREATE INDEX IF NOT EXISTS idx_n8n_generations_cover_letter_request_id ON n8n_generations_cover_letter(request_id);
CREATE INDEX IF NOT EXISTS idx_n8n_generations_cover_letter_created_at ON n8n_generations_cover_letter(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_n8n_generations_cover_letter_tone ON n8n_generations_cover_letter(tone);

-- Enable RLS
ALTER TABLE n8n_generations_resume ENABLE ROW LEVEL SECURITY;
ALTER TABLE n8n_generations_cover_letter ENABLE ROW LEVEL SECURITY;

-- Create policies for n8n_generations_resume
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

-- Create policies for n8n_generations_cover_letter
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
INSERT INTO n8n_generations_resume (
  job_type,
  company_name,
  job_title,
  content,
  ats_score,
  keywords,
  suggestions_count,
  user_id,
  request_id
) VALUES (
  'application',
  'Example Corp',
  'Software Engineer',
  'RESUME OPTIMIZATION SUGGESTIONS

KEYWORDS TO INCLUDE:
• JavaScript
• React
• Node.js
• TypeScript
• API Development
• Cloud Services
• Agile Methodology
• Unit Testing

SKILLS TO HIGHLIGHT:
• Full-stack development experience
• Problem-solving abilities
• Team collaboration
• Code optimization
• Performance tuning

ATS OPTIMIZATION TIPS:
1. Use standard section headings
2. Include exact keyword matches
3. Quantify achievements with metrics
4. Keep formatting simple and clean
5. Use bullet points for readability

EXPERIENCE FORMATTING:
• Start with action verbs
• Focus on achievements, not just responsibilities
• Include metrics and results
• Tailor experience to match job requirements
• Highlight relevant projects

RECOMMENDED STRUCTURE:
1. Professional Summary
2. Technical Skills
3. Professional Experience
4. Projects
5. Education
6. Certifications',
  85,
  ARRAY['JavaScript', 'React', 'Node.js', 'TypeScript', 'API Development', 'Cloud Services'],
  12,
  '00000000-0000-0000-0000-000000000000',
  'test-n8n-request-123'
);

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