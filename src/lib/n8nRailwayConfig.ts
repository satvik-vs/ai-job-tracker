// N8N Railway Integration Configuration

export const N8N_RAILWAY_CONFIG = {
  // Your Railway domain
  DOMAIN: 'https://primary-production-130e0.up.railway.app',
  
  // Webhook endpoints
  WEBHOOK_PATH: '/webhook/job-application-received',
  
  // Full webhook URL for your Railway N8N instance
  WEBHOOK_URL: 'https://primary-production-130e0.up.railway.app/webhook/job-application-received',
  
  // Supabase edge function URLs
  TRIGGER_FUNCTION_URL: 'https://zeiivnxtkcqwlnmtxyfd.supabase.co/functions/v1/n8n-trigger',
  RESPONSE_FUNCTION_URL: 'https://zeiivnxtkcqwlnmtxyfd.supabase.co/functions/v1/n8n-response',
  
  // Timeout settings
  PROCESSING_TIMEOUT: 300000, // 5 minutes
  POLL_INTERVAL: 2000, // 2 seconds
  
  // Progress settings
  PROGRESS_DURATION: 300, // 5 minutes for progress bar
  
  // Request headers
  HEADERS: {
    'Content-Type': 'application/json',
    'User-Agent': 'JobTracker-AI/1.0',
    'X-Request-Source': 'jobtracker-ai',
    'X-Railway-Domain': 'primary-production-130e0.up.railway.app'
  }
};

// Types for N8N Railway integration
export interface N8NRailwayPayload {
  type: 'resume' | 'cover-letter';
  user_id: string;
  user_email: string;
  request_id: string;
  timestamp: string;
  data: {
    company_name: string;
    job_title: string;
    job_description: string;
    selected_job_id?: string;
    // Cover letter specific
    hiring_manager?: string;
    tone?: string;
    personal_experience?: string;
    why_company?: string;
  };
}

export interface N8NRailwayResponse {
  request_id: string;
  type: 'resume' | 'cover-letter';
  status: 'success' | 'error';
  content?: string;
  error_message?: string;
  processing_time?: number;
  metadata?: {
    keywords_found?: string[];
    ats_score?: number;
    suggestions_count?: number;
    tone_used?: string;
    word_count?: number;
    personalization_score?: number;
  };
  job_application_id?: string;
}