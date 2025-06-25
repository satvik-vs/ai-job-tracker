import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import axios from 'axios';

interface N8nResumeGeneration {
  id: string;
  job_id: string | null;
  job_type: 'application' | 'linkedin';
  company_name: string;
  job_title: string;
  content: string;
  ats_score: number;
  keywords: string[];
  suggestions_count: number;
  created_at: string;
  request_id: string | null;
  user_id: string;
}

interface N8nCoverLetterGeneration {
  id: string;
  job_id: string | null;
  job_type: 'application' | 'linkedin';
  company_name: string;
  job_title: string;
  content: string;
  tone: string;
  personalization_score: number;
  word_count: number;
  created_at: string;
  request_id: string | null;
  user_id: string;
}

export function useN8nGenerations() {
  const [resumeGenerations, setResumeGenerations] = useState<N8nResumeGeneration[]>([]);
  const [coverLetterGenerations, setCoverLetterGenerations] = useState<N8nCoverLetterGeneration[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Load generations on mount
  useEffect(() => {
    fetchResumeGenerations();
    fetchCoverLetterGenerations();
  }, []);

  const fetchResumeGenerations = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('n8n_generations_resume')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResumeGenerations(data || []);
    } catch (error) {
      console.error('Error fetching resume generations:', error);
      toast.error('Failed to load resume generations');
    } finally {
      setLoading(false);
    }
  };

  const fetchCoverLetterGenerations = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('n8n_generations_cover_letter')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoverLetterGenerations(data || []);
    } catch (error) {
      console.error('Error fetching cover letter generations:', error);
      toast.error('Failed to load cover letter generations');
    } finally {
      setLoading(false);
    }
  };

  const startProgressTimer = (duration: number = 300) => {
    setTimeRemaining(duration);
    setProgress(0);
    
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
      
      setProgress(prev => {
        const newProgress = ((duration - timeRemaining + 1) / duration) * 100;
        return Math.min(newProgress, 95); // Cap at 95% until we get response
      });
    }, 1000);

    return interval;
  };

  const triggerN8nWorkflow = async (
    type: 'resume' | 'cover-letter',
    formData: any
  ) => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Generate a unique request ID
      const requestId = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Extract job ID and type
      let jobId = null;
      let jobType = 'application';
      
      if (formData.selectedJobId) {
        if (formData.selectedJobId.startsWith('app_')) {
          jobId = formData.selectedJobId.replace('app_', '');
          jobType = 'application';
        } else if (formData.selectedJobId.startsWith('linkedin_')) {
          jobId = formData.selectedJobId.replace('linkedin_', '');
          jobType = 'linkedin';
        }
      }

      // Prepare payload for N8N
      const payload = {
        type,
        user_id: user.id,
        user_email: user.email || '',
        request_id: requestId,
        timestamp: new Date().toISOString(),
        data: {
          company_name: formData.companyName,
          job_title: formData.jobTitle,
          job_description: formData.jobDescription,
          selected_job_id: jobId,
          // Cover letter specific fields
          hiring_manager: formData.hiringManager || '',
          tone: formData.tone || 'professional',
          personal_experience: formData.personalExperience || '',
          why_company: formData.whyCompany || ''
        }
      };

      console.log('🚀 Sending to N8N Railway:', payload);

      // Send directly to N8N Railway webhook
      const response = await axios.post(
        'https://primary-production-130e0.up.railway.app/webhook/job-application-received',
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'JobTracker-AI/1.0',
            'Accept': 'application/json',
            'X-Request-Source': 'jobtracker-ai-direct',
            'X-Railway-Domain': 'primary-production-130e0.up.railway.app'
          }
        }
      );

      if (response.status !== 200) {
        throw new Error(`N8N webhook failed: ${response.status} ${response.statusText}`);
      }

      console.log('✅ N8N webhook triggered successfully');
      
      // Start progress timer
      const timer = startProgressTimer(300); // 5 minutes
      
      // Create a placeholder entry in the appropriate table
      if (type === 'resume') {
        await supabase.from('n8n_generations_resume').insert({
          job_id: jobId,
          job_type: jobType,
          company_name: formData.companyName,
          job_title: formData.jobTitle,
          content: 'Generating resume suggestions...',
          ats_score: 0,
          keywords: [],
          suggestions_count: 0,
          request_id: requestId,
          user_id: user.id
        });
      } else {
        await supabase.from('n8n_generations_cover_letter').insert({
          job_id: jobId,
          job_type: jobType,
          company_name: formData.companyName,
          job_title: formData.jobTitle,
          content: 'Generating cover letter...',
          tone: formData.tone || 'professional',
          personalization_score: 0,
          word_count: 0,
          request_id: requestId,
          user_id: user.id
        });
      }
      
      // Poll for response
      const maxAttempts = 150; // 5 minutes max wait (150 * 2 seconds)
      let attempts = 0;
      
      const pollForResponse = async (): Promise<void> => {
        if (attempts >= maxAttempts) {
          clearInterval(timer);
          setLoading(false);
          setProgress(100);
          throw new Error('Request timed out. Please try again.');
        }
        
        attempts++;
        console.log(`🔍 Polling attempt ${attempts}/${maxAttempts} for request ${requestId}`);
        
        // Check if we received a response
        let response;
        if (type === 'resume') {
          response = await checkForResumeResponse(requestId);
        } else {
          response = await checkForCoverLetterResponse(requestId);
        }
        
        if (response) {
          clearInterval(timer);
          setProgress(100);
          setTimeRemaining(0);
          
          console.log('🎉 Response received:', response);
          
          if (type === 'resume') {
            await fetchResumeGenerations();
          } else {
            await fetchCoverLetterGenerations();
          }
          
          setLoading(false);
          return;
        }
        
        // Continue polling
        setTimeout(pollForResponse, 2000); // Poll every 2 seconds
      };
      
      pollForResponse();
      
      return requestId;
    } catch (error: any) {
      console.error('❌ Error triggering N8N workflow:', error);
      setLoading(false);
      setProgress(0);
      setTimeRemaining(0);
      toast.error(error.message || 'Failed to trigger N8N workflow');
      throw error;
    }
  };

  const checkForResumeResponse = async (requestId: string): Promise<N8nResumeGeneration | null> => {
    try {
      const { data, error } = await supabase
        .from('n8n_generations_resume')
        .select('*')
        .eq('request_id', requestId)
        .single();

      if (error) {
        console.error('Error checking for resume response:', error);
        return null;
      }

      if (data && data.content !== 'Generating resume suggestions...') {
        return data;
      }

      return null;
    } catch (error) {
      console.error('Error checking for resume response:', error);
      return null;
    }
  };

  const checkForCoverLetterResponse = async (requestId: string): Promise<N8nCoverLetterGeneration | null> => {
    try {
      const { data, error } = await supabase
        .from('n8n_generations_cover_letter')
        .select('*')
        .eq('request_id', requestId)
        .single();

      if (error) {
        console.error('Error checking for cover letter response:', error);
        return null;
      }

      if (data && data.content !== 'Generating cover letter...') {
        return data;
      }

      return null;
    } catch (error) {
      console.error('Error checking for cover letter response:', error);
      return null;
    }
  };

  const getResumeGenerationById = (id: string): N8nResumeGeneration | undefined => {
    return resumeGenerations.find(gen => gen.id === id);
  };

  const getCoverLetterGenerationById = (id: string): N8nCoverLetterGeneration | undefined => {
    return coverLetterGenerations.find(gen => gen.id === id);
  };

  const getResumeGenerationByJobId = (jobId: string): N8nResumeGeneration | undefined => {
    return resumeGenerations.find(gen => gen.job_id === jobId);
  };

  const getCoverLetterGenerationByJobId = (jobId: string): N8nCoverLetterGeneration | undefined => {
    return coverLetterGenerations.find(gen => gen.job_id === jobId);
  };

  return {
    resumeGenerations,
    coverLetterGenerations,
    loading,
    progress,
    timeRemaining,
    fetchResumeGenerations,
    fetchCoverLetterGenerations,
    triggerN8nWorkflow,
    getResumeGenerationById,
    getCoverLetterGenerationById,
    getResumeGenerationByJobId,
    getCoverLetterGenerationByJobId
  };
}