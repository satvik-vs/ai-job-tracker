-- Add resume_content column to documents table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documents' AND column_name = 'resume_content'
  ) THEN
    ALTER TABLE documents ADD COLUMN resume_content text;
  END IF;
END $$;

-- Add comment to explain the column's purpose
COMMENT ON COLUMN documents.resume_content IS 'Extracted text content from resume files for AI analysis';

-- Create index for full-text search on resume content
CREATE INDEX IF NOT EXISTS idx_documents_resume_content ON documents USING gin(to_tsvector('english', coalesce(resume_content, '')));

-- Create function to extract keywords from resume content
CREATE OR REPLACE FUNCTION extract_resume_keywords(p_resume_content text)
RETURNS text[] AS $$
DECLARE
  keywords text[];
  common_tech_terms text[] := ARRAY[
    'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'rust',
    'react', 'angular', 'vue', 'svelte', 'node.js', 'express', 'django', 'flask',
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'jenkins',
    'sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch',
    'git', 'github', 'gitlab', 'bitbucket', 'ci/cd', 'devops',
    'agile', 'scrum', 'kanban', 'jira', 'confluence',
    'machine learning', 'ai', 'data science', 'big data', 'analytics'
  ];
  term text;
BEGIN
  keywords := '{}';
  
  -- Extract common tech terms
  FOREACH term IN ARRAY common_tech_terms LOOP
    IF p_resume_content ILIKE '%' || term || '%' THEN
      keywords := array_append(keywords, term);
    END IF;
  END LOOP;
  
  RETURN keywords;
END;
$$ LANGUAGE plpgsql;

-- Add sample data for testing
DO $$
BEGIN
  -- Only add sample data if the table is empty
  IF NOT EXISTS (SELECT 1 FROM documents LIMIT 1) THEN
    INSERT INTO documents (
      user_id,
      file_name,
      file_type,
      file_url,
      file_size,
      resume_content
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      'sample_resume.pdf',
      'resume',
      'https://example.com/documents/sample_resume.pdf',
      245000,
      'John Doe
      Software Engineer

      SUMMARY
      Experienced software engineer with 5+ years of experience in full-stack development using JavaScript, TypeScript, React, and Node.js. Passionate about building scalable web applications and solving complex problems.

      SKILLS
      Programming Languages: JavaScript, TypeScript, Python, Java
      Frontend: React, Redux, HTML5, CSS3, SASS
      Backend: Node.js, Express, Django, Flask
      Databases: PostgreSQL, MongoDB, Redis
      Cloud: AWS, Docker, Kubernetes
      Tools: Git, GitHub, JIRA, Confluence

      EXPERIENCE
      Senior Software Engineer | TechCorp | 2020 - Present
      - Developed and maintained microservices architecture using Node.js and Express
      - Implemented CI/CD pipelines using GitHub Actions and Docker
      - Reduced API response time by 40% through optimization techniques
      - Led a team of 5 developers for the customer portal project

      Software Engineer | StartupXYZ | 2018 - 2020
      - Built responsive web applications using React and Redux
      - Designed and implemented RESTful APIs using Node.js
      - Collaborated with UX designers to improve user experience
      - Participated in code reviews and mentored junior developers

      EDUCATION
      Bachelor of Science in Computer Science
      University of Technology, 2018'
    );
  END IF;
END $$;