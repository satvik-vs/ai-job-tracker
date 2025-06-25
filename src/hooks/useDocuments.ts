import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { debounce } from 'lodash-es';
import toast from 'react-hot-toast';

type Document = Database['public']['Tables']['documents']['Row'];

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if user is authenticated
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setDocuments([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .order('uploaded_on', { ascending: false })
        .limit(100); // Reasonable limit

      if (error) throw error;
      setDocuments(data || []);
    } catch (error: any) {
      console.error('Error fetching documents:', error);
      setError('Failed to load documents');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced fetch to prevent excessive API calls
  const debouncedFetch = debounce(fetchDocuments, 300);

  useEffect(() => {
    debouncedFetch();
    
    return () => {
      debouncedFetch.cancel();
    };
  }, []);

  const uploadDocument = async (file: File, fileType: Document['file_type'], linkedJobId?: string) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Create a more realistic mock URL
      const mockUrl = `https://storage.googleapis.com/jobtracker-documents/${user.id}/${fileType}/${file.name}`;
      
      // Extract text content from resume if applicable
      let resumeContent = null;
      if (fileType === 'resume') {
        // In a real implementation, you would extract text from the file
        // For now, we'll use a placeholder
        resumeContent = `This is extracted content from ${file.name}. 
In a production environment, we would use a PDF parser or similar tool to extract the actual text content.`;
      }

      // Save document record
      const { data, error } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_type: fileType,
          file_url: mockUrl,
          file_size: file.size,
          linked_job_id: linkedJobId,
          resume_content: resumeContent
        })
        .select()
        .single();

      if (error) throw error;

      // Optimistically update the list
      setDocuments(prev => [data, ...prev]);
      toast.success('Document uploaded successfully!');
      return data;
    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document');
      throw error;
    }
  };

  const deleteDocument = async (id: string, fileUrl?: string) => {
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Optimistically update the list
      setDocuments(prev => prev.filter(doc => doc.id !== id));
      toast.success('Document deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
      throw error;
    }
  };

  return {
    documents,
    loading,
    error,
    uploadDocument,
    deleteDocument,
    refetch: fetchDocuments,
  };
}