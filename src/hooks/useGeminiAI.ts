import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
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

export function useGeminiAI() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [generatedContent, setGeneratedContent] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [modelId, setModelId] = useState('gemini-2.0-flash');

  const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
  const DEFAULT_API_KEY = 'AIzaSyAkhEzZwuPRRP37vppknTgx3m1qNTzCSkE';

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
    
    const prompt = `You are a resume optimization assistant. Analyze the following resume against the job description and provide comprehensive suggestions for improvement.

Resume Content:
${resumeContent}

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
      
      const response = await fetch(`${GEMINI_BASE_URL}/models/${modelId}:generateContent?key=${effectiveApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API error response:', errorText);
        throw new Error(`Gemini API error: ${response.status}${errorText ? ` - ${errorText}` : ''}`);
      }

      const data: GeminiResponse = await response.json();
      const content = data.candidates[0]?.content?.parts[0]?.text;

      if (!content) {
        throw new Error('No content received from Gemini API');
      }

      return {
        content,
        metadata: {
          keywords_found: extractKeywords(content),
          ats_score: calculateATSScore(content),
          suggestions_count: countSuggestions(content)
        }
      };
    } catch (error: any) {
      console.error('Gemini API error:', error);
      
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
    
    const prompt = `You are a resume optimization assistant. Analyze the following job description and provide comprehensive suggestions for creating an optimized resume.

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
      
      const response = await fetch(`${GEMINI_BASE_URL}/models/${modelId}:generateContent?key=${effectiveApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API error response:', errorText);
        throw new Error(`Gemini API error: ${response.status}${errorText ? ` - ${errorText}` : ''}`);
      }

      const data: GeminiResponse = await response.json();
      const content = data.candidates[0]?.content?.parts[0]?.text;

      if (!content) {
        throw new Error('No content received from Gemini API');
      }

      return {
        content,
        metadata: {
          keywords_found: extractKeywords(content),
          ats_score: calculateATSScore(content),
          suggestions_count: countSuggestions(content)
        }
      };
    } catch (error: any) {
      console.error('Gemini API error:', error);
      throw error;
    }
  };

  // Helper functions for metadata extraction
  const extractKeywords = (content: string): string[] => {
    const keywordRegex = /keywords?|skills?|technologies|tools|frameworks|languages/i;
    const lines = content.split('\n');
    const keywordLines = lines.filter(line => keywordRegex.test(line));
    
    // Extract words that look like technologies or skills
    const techRegex = /\b(javascript|typescript|python|java|react|node\.js|aws|docker|kubernetes|sql|nosql|mongodb|postgresql|git|github|agile|scrum|css|html|api|rest|graphql)\b/gi;
    const allMatches = content.match(techRegex) || [];
    
    // Deduplicate and return
    return [...new Set(allMatches.map(match => match.toLowerCase()))];
  };

  const calculateATSScore = (content: string): number => {
    // Simple heuristic based on content length and keyword density
    const length = content.length;
    const keywordCount = extractKeywords(content).length;
    
    // Score between 70-95 based on content quality indicators
    let score = 70;
    
    // Length bonus (up to +10)
    if (length > 1000) score += 10;
    else if (length > 500) score += 5;
    
    // Keyword bonus (up to +10)
    if (keywordCount > 15) score += 10;
    else if (keywordCount > 8) score += 5;
    
    // Structure bonus (up to +5)
    if (content.includes('ATS') || content.includes('Applicant Tracking System')) score += 5;
    
    return Math.min(score, 95);
  };

  const countSuggestions = (content: string): number => {
    // Count bullet points as suggestions
    const bulletPoints = (content.match(/•|-|\*/g) || []).length;
    
    // Count numbered items
    const numberedItems = (content.match(/\d+\.\s/g) || []).length;
    
    return Math.max(bulletPoints + numberedItems, 5);
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
        request_id: `gemini-${Date.now()}`
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
            ai_provider: 'gemini'
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