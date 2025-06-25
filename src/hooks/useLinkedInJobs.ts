import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface LinkedInJob {
  id: string;
  title: string;
  location: string;
  company_name: string;
  posted_at: string;
  description: string;
  seniority: string;
  employment_type: string;
  apply_url: string;
  source: string;
  recruiter_name: string;
  recruiter_profile: string;
  recruiter_profile_url: string;
  created_at: string;
}

export function useLinkedInJobs() {
  const [jobs, setJobs] = useState<LinkedInJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLinkedInJobs();
  }, []);

  const fetchLinkedInJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('linkedin_jobs')
        .select('*')
        .order('posted_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      setJobs(data || []);
    } catch (error: any) {
      console.error('Error fetching LinkedIn jobs:', error);
      setError('Failed to load LinkedIn jobs');
      toast.error('Failed to load LinkedIn jobs');
    } finally {
      setLoading(false);
    }
  };

  const getJobById = (id: string) => {
    return jobs.find(job => job.id === id);
  };

  const searchJobs = (searchTerm: string) => {
    if (!searchTerm.trim()) return jobs;
    
    const term = searchTerm.toLowerCase();
    return jobs.filter(job => 
      job.title?.toLowerCase().includes(term) ||
      job.company_name?.toLowerCase().includes(term) ||
      job.location?.toLowerCase().includes(term) ||
      job.description?.toLowerCase().includes(term)
    );
  };

  return {
    jobs,
    loading,
    error,
    fetchLinkedInJobs,
    getJobById,
    searchJobs,
    refetch: fetchLinkedInJobs
  };
}