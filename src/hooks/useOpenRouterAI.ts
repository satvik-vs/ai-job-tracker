import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface ResumeAnalysisResult {
  content: string;
  metadata: {
    keywords_found: string[];
    ats_score: number;
    suggestions_count: number;
  };
}

export function useOpenRouterAI() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [generatedContent, setGeneratedContent] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [modelId, setModelId] = useState('deepseek/deepseek-r1-0528:free');

  const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
  const DEFAULT_API_KEY = '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';

  // Load API key from user settings on mount
  useEffect(() => {
    const loadApiKey = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: settings } = await supabase
          .from('user_settings')
          .select('openai_api_key, ai_provider')
          .eq('user_id', user.id)
          .single();
        
        if (settings?.openai_api_key) {
          setApiKey(settings.openai_api_key);
        }
      } catch (error) {
        console.log('No custom API key found, using default');
      }
    };

    loadApiKey();
  }, []);

  const startProgressTimer = (duration: number = 30) => {
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
        return Math.min(newProgress, 95);
      });
    }, 1000);

    return interval;
  };

  const analyzeResumeWithJob = async (
    resumeContent: string,
    jobTitle: string,
    companyName: string,
    jobDescription: string,
    selectedJobId?: string
  ): Promise<ResumeAnalysisResult> => {
    const requestId = `resume-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const systemPrompt = `You are a resume optimization assistant. 
Respond ONLY in this exact JSON format and **ensure it is a single flat object**:

{
  "selected_job_id": "${selectedJobId || ''}",
  "request_id": "${requestId}",
  "type": "resume",
  "status": "success",
  "content": "<<< FULL resume improvement suggestions as a formatted string >>>",
  "processing_time": 30,
  "metadata": {
    "keywords_found": [...],
    "ats_score": 90,
    "suggestions_count": 10
  }
}

Important:
- The value of 'content' must be a full string (not an object).
- Use bullet points and headings inside the string.
- Never return content as a nested object.`;

    const userPrompt = `I want resume suggestions for this job:

Job Title: ${jobTitle}
Company: ${companyName}
Job Description:
${jobDescription}

Current Resume Content:
${resumeContent}

Instructions:
- Return the response in the JSON format provided above.
- Place all optimization suggestions inside the 'content' field as a nicely formatted **string**.
- Use bullet points, subheadings, and clearly separate each section: keywords, summary, skills, experience, ATS tips, company insights, checklist.
- Replace 'request_id' with this: ${requestId}
- Replace 'selected_job_id' with this: ${selectedJobId || ''}`;

    try {
      // Use the provided API key or fall back to the default
      const effectiveApiKey = apiKey || DEFAULT_API_KEY;
      
      const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${effectiveApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://jobtracker-ai.vercel.app',
          'X-Title': 'JobTracker AI'
        },
        body: JSON.stringify({
          model: modelId,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenRouter API error response:', errorText);
        throw new Error(`OpenRouter API error: ${response.status}${errorText ? ` - ${errorText}` : ''}`);
      }

      const data: OpenRouterResponse = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No content received from OpenRouter API');
      }

      try {
        // Try to parse as JSON first
        const jsonResponse = JSON.parse(content);
        return {
          content: jsonResponse.content,
          metadata: jsonResponse.metadata || {
            keywords_found: [],
            ats_score: 85,
            suggestions_count: 8
          }
        };
      } catch (error) {
        console.log('Response is not JSON, using as plain text:', content);
        // If not JSON, return as plain text
        return {
          content,
          metadata: {
            keywords_found: [],
            ats_score: 85,
            suggestions_count: 8
          }
        };
      }
    } catch (error: any) {
      console.error('OpenRouter API error:', error);
      
      // Fallback to job-only analysis if resume analysis fails
      console.log('Falling back to job-only analysis...');
      return analyzeJobOnly(jobTitle, companyName, jobDescription, selectedJobId);
    }
  };

  const analyzeJobOnly = async (
    jobTitle: string,
    companyName: string,
    jobDescription: string,
    selectedJobId?: string
  ): Promise<ResumeAnalysisResult> => {
    const requestId = `job-analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const systemPrompt = `You are a resume optimization assistant. Analyze the job description and provide comprehensive resume optimization suggestions. Respond with detailed, actionable advice formatted as a comprehensive guide.`;

    const userPrompt = `Analyze this job description and provide comprehensive resume optimization suggestions:

Job Title: ${jobTitle}
Company: ${companyName}
Job Description:
${jobDescription}

Provide detailed suggestions for:
1. Keywords to include
2. Skills to highlight
3. Experience formatting
4. ATS optimization
5. Industry-specific recommendations
6. Action verbs to use
7. Quantifiable achievements examples
8. Section organization

Format as a comprehensive guide with clear sections and bullet points.`;

    try {
      // Use the provided API key or fall back to the default
      const effectiveApiKey = apiKey || DEFAULT_API_KEY;
      
      const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${effectiveApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://jobtracker-ai.vercel.app',
          'X-Title': 'JobTracker AI'
        },
        body: JSON.stringify({
          model: modelId,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenRouter API error response:', errorText);
        throw new Error(`OpenRouter API error: ${response.status}${errorText ? ` - ${errorText}` : ''}`);
      }

      const data: OpenRouterResponse = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No content received from OpenRouter API');
      }

      return {
        content,
        metadata: {
          keywords_found: [],
          ats_score: 80,
          suggestions_count: 10
        }
      };
    } catch (error: any) {
      console.error('OpenRouter API error:', error);
      throw error;
    }
  };

  const generateContent = async (
    type: 'resume' | 'cover-letter',
    formData: any,
    resumeContent?: string
  ) => {
    try {
      setLoading(true);
      setGeneratedContent('');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      console.log('🎯 Starting content generation:', { type, formData, hasResume: !!resumeContent });

      // Check for user-specific API key in settings
      try {
        const { data: settings } = await supabase
          .from('user_settings')
          .select('openai_api_key, ai_provider')
          .eq('user_id', user.id)
          .single();
        
        if (settings?.openai_api_key) {
          setApiKey(settings.openai_api_key);
        }
      } catch (error) {
        console.log('No custom API key found, using default');
      }

      const timer = startProgressTimer(30);
      
      let result: ResumeAnalysisResult;

      if (type === 'resume') {
        if (resumeContent) {
          // Analyze resume with job description
          result = await analyzeResumeWithJob(
            resumeContent,
            formData.job_title,
            formData.company_name,
            formData.job_description,
            formData.selected_job_id
          );
        } else {
          // Fallback: analyze job description only
          result = await analyzeJobOnly(
            formData.job_title,
            formData.company_name,
            formData.job_description,
            formData.selected_job_id
          );
        }
      } else {
        // Cover letter generation (not implemented)
        throw new Error('Cover letter generation not implemented in this version');
      }

      clearInterval(timer);
      setProgress(100);
      setTimeRemaining(0);
      
      // Store in database
      await supabase.from('ai_generations').insert({
        job_application_id: formData.selected_job_id || null,
        type,
        content: result.content,
        is_used: false,
        request_id: `openrouter-${Date.now()}`
      });

      setGeneratedContent(result.content);
      toast.success('Resume analysis completed successfully!');
      
    } catch (error: any) {
      console.error('❌ Error generating content:', error);
      setLoading(false);
      setProgress(0);
      setTimeRemaining(0);
      toast.error(error.message || 'Failed to generate content');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setLoading(false);
    setProgress(0);
    setTimeRemaining(0);
    setGeneratedContent('');
  };

  const updateSettings = (newApiKey: string, newModelId: string) => {
    setApiKey(newApiKey);
    setModelId(newModelId);
    
    // Save to user settings if user is authenticated
    const saveSettings = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        await supabase
          .from('user_settings')
          .upsert({
            user_id: user.id,
            openai_api_key: newApiKey,
            ai_provider: 'openrouter'
          });
      } catch (error) {
        console.error('Failed to save settings:', error);
      }
    };
    
    saveSettings();
  };

  return {
    loading,
    progress,
    timeRemaining,
    generatedContent,
    generateContent,
    resetState,
    setGeneratedContent,
    apiKey,
    modelId,
    updateSettings
  };
}