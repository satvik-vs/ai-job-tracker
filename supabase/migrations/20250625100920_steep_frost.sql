/*
  # Create AI Generations Table

  1. New Table
    - Create ai_generations table if it doesn't exist
    - Add request_id column for n8n workflow integration
    - Make job_application_id nullable for n8n workflow responses
    
  2. Security
    - Enable RLS on the table
    - Create policies for authenticated users
    
  3. Indexes
    - Create indexes for better performance
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

-- Make job_application_id nullable
ALTER TABLE ai_generations ALTER COLUMN job_application_id DROP NOT NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_generations_request_id ON ai_generations(request_id);
CREATE INDEX IF NOT EXISTS idx_ai_generations_type_generated ON ai_generations(type, generated_on DESC);
CREATE INDEX IF NOT EXISTS idx_ai_generations_job_application_id ON ai_generations(job_application_id);

-- Enable RLS on ai_generations table
ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;

-- Create policies for ai_generations
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