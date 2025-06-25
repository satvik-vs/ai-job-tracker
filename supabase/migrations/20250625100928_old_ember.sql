/*
  # Create N8N Generation Tables

  1. New Tables
    - n8n_generations_resume: For storing AI-generated resume insights
    - n8n_generations_cover_letter: For storing AI-generated cover letter content
    
  2. Security
    - Enable RLS on all tables
    - Create policies for authenticated users
    
  3. Indexes
    - Create indexes for better performance
*/

-- Create n8n_generations_resume table
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
  created_at timestamptz DEFAULT now(),
  UNIQUE(job_id)
);

-- Create n8n_generations_cover_letter table
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
  created_at timestamptz DEFAULT now(),
  UNIQUE(job_id)
);

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

-- Insert sample data for testing
DO $$
DECLARE
  sample_user_id uuid;
  sample_job_id uuid;
BEGIN
  -- Get a sample user ID
  SELECT id INTO sample_user_id FROM profiles LIMIT 1;
  
  -- Get a sample job ID
  SELECT id INTO sample_job_id FROM linkedin_jobs LIMIT 1;
  
  -- Only insert if we have valid IDs
  IF sample_user_id IS NOT NULL AND sample_job_id IS NOT NULL THEN
    -- Insert sample resume generation
    INSERT INTO n8n_generations_resume (
      job_id,
      job_type,
      company_name,
      job_title,
      job_description,
      ats_score,
      keywords,
      suggestions_count,
      content,
      request_id,
      user_id
    ) VALUES (
      sample_job_id,
      'linkedin',
      'Sample Company',
      'Software Engineer',
      'This is a sample job description for a software engineering position.',
      85,
      ARRAY['javascript', 'react', 'node.js', 'typescript'],
      12,
      'RESUME OPTIMIZATION SUGGESTIONS

## Keywords to Include
- JavaScript
- React
- Node.js
- TypeScript
- Full-stack development
- RESTful APIs
- Agile methodology

## Skills to Highlight
- Front-end development with React
- Back-end development with Node.js
- Database design and management
- API integration
- Performance optimization

## Experience Formatting
- Use bullet points for clarity
- Start with strong action verbs
- Quantify achievements where possible
- Focus on results and impact
- Tailor experience to match job requirements

## ATS Optimization
- Use standard section headings
- Include exact keywords from job description
- Avoid complex formatting
- Use a clean, simple layout
- Save as PDF format

## Action Verbs to Use
- Developed
- Implemented
- Optimized
- Designed
- Collaborated
- Led
- Managed
- Reduced
- Increased
- Improved',
      'sample-request-id-123',
      sample_user_id
    ) ON CONFLICT (job_id) DO NOTHING;
    
    -- Insert sample cover letter generation
    INSERT INTO n8n_generations_cover_letter (
      job_id,
      job_type,
      company_name,
      job_title,
      job_description,
      content,
      tone,
      keywords,
      personalization_score,
      word_count,
      request_id,
      user_id
    ) VALUES (
      sample_job_id,
      'linkedin',
      'Sample Company',
      'Software Engineer',
      'This is a sample job description for a software engineering position.',
      'Dear Hiring Manager,

I am writing to express my strong interest in the Software Engineer position at Sample Company. With my background in full-stack development and expertise in JavaScript, React, and Node.js, I am confident that I would be a valuable addition to your team.

Throughout my career, I have developed a strong proficiency in building scalable web applications, implementing RESTful APIs, and optimizing performance. My experience aligns perfectly with the requirements outlined in your job description, and I am excited about the opportunity to contribute to your innovative projects.

What draws me to Sample Company is your commitment to technological excellence and your focus on creating impactful solutions. I am particularly impressed by your recent work on [specific project or achievement], and I am eager to bring my skills and passion to help further your mission.

I look forward to discussing how my experience and enthusiasm can contribute to Sample Company''s continued success. Thank you for considering my application.

Sincerely,
[Your Name]',
      'professional',
      ARRAY['javascript', 'react', 'node.js', 'full-stack'],
      90,
      250,
      'sample-request-id-456',
      sample_user_id
    ) ON CONFLICT (job_id) DO NOTHING;
  END IF;
END $$;