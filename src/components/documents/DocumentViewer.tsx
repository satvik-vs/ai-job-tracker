import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Download, Copy, FileText, File, ExternalLink } from 'lucide-react';
import { Database } from '../../lib/database.types';
import toast from 'react-hot-toast';

type Document = Database['public']['Tables']['documents']['Row'];

interface DocumentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document;
}

export function DocumentViewer({ isOpen, onClose, document }: DocumentViewerProps) {
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      
      // In a real implementation, you would fetch the document content
      // For now, we'll simulate loading and show a placeholder
      const timer = setTimeout(() => {
        setLoading(false);
        
        // For resume documents, show the resume_content if available
        if (document.file_type === 'resume' && document.resume_content) {
          setContent(document.resume_content);
        } else {
          setContent(`This is a placeholder for the content of ${document.file_name}.
          
In a production environment, the actual content would be displayed here.`);
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, document]);

  // Function to handle document download
  const handleDownload = () => {
    // Check if the URL is a data URL
    if (document.file_url.startsWith('data:')) {
      // For data URLs, we can just open them directly
      const link = document.createElement('a');
      link.href = document.file_url;
      link.download = document.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Download started');
      return;
    }
    
    // Check if the URL is a mock URL and create a blob instead
    if (document.file_url.includes('example.com') || 
        document.file_url.includes('storage.googleapis.com') || 
        document.file_url.includes('jobtracker-documents')) {
      // Create a blob with placeholder content
      const blob = new Blob([content || `This is a placeholder for ${document.file_name}`], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = document.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Download started');
      return;
    }
    
    // For real URLs, open in a new tab
    window.open(document.file_url, '_blank');
    toast.success('Download started');
  };

  // Function to handle document copy link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(document.file_url);
    toast.success('Document link copied to clipboard');
  };

  // Function to open document in new tab
  const handleOpenInNewTab = () => {
    // For data URLs, we can just open them directly
    if (document.file_url.startsWith('data:')) {
      window.open(document.file_url, '_blank');
      return;
    }
    
    // For mock URLs, create a data URL with the content
    if (document.file_url.includes('example.com') || 
        document.file_url.includes('storage.googleapis.com') || 
        document.file_url.includes('jobtracker-documents')) {
      const blob = new Blob([content || `This is a placeholder for ${document.file_name}`], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const newWindow = window.open(url, '_blank');
      
      // Clean up the URL after the window loads
      if (newWindow) {
        newWindow.onload = () => URL.revokeObjectURL(url);
      }
      return;
    }
    
    // For real URLs, open in a new tab
    window.open(document.file_url, '_blank');
  };

  // Determine file extension
  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  const fileExtension = getFileExtension(document.file_name);

  // Render appropriate viewer based on file type
  const renderDocumentContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      );
    }

    // For PDF files
    if (fileExtension === 'pdf') {
      return (
        <div className="flex flex-col space-y-4">
          <div className="bg-dark-800/70 p-4 rounded-lg border border-slate-700/50">
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <FileText className="w-16 h-16 text-primary-400" />
              <p className="text-slate-300 text-lg font-medium">PDF Document</p>
              <p className="text-slate-400 text-sm text-center">
                {document.file_name}<br/>
                <span className="text-xs">({(document.file_size / 1024).toFixed(1)} KB)</span>
              </p>
              <div className="flex space-x-3">
                <Button onClick={handleOpenInNewTab} leftIcon={<ExternalLink className="w-4 h-4" />}>
                  Open in New Tab
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // For image files
    if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
      return (
        <div className="flex flex-col items-center space-y-4">
          <img 
            src={document.file_url} 
            alt={document.file_name} 
            className="max-w-full max-h-64 object-contain rounded-lg"
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              toast.error('Failed to load image');
            }}
          />
          <div className="flex space-x-3">
            <Button onClick={handleOpenInNewTab} leftIcon={<ExternalLink className="w-4 h-4" />}>
              Open in New Tab
            </Button>
            <Button onClick={handleDownload} leftIcon={<Download className="w-4 h-4" />} variant="outline">
              Download
            </Button>
          </div>
        </div>
      );
    }

    // For text content (resume_content or other text files)
    if (content || ['txt', 'md', 'html', 'css', 'js', 'json'].includes(fileExtension)) {
      return (
        <div className="flex flex-col space-y-4">
          <div className="bg-dark-800/70 p-4 rounded-lg overflow-auto max-h-96 border border-slate-700/50">
            <pre className="text-slate-300 whitespace-pre-wrap font-mono text-sm">
              {content}
            </pre>
          </div>
        </div>
      );
    }

    // Default fallback
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <File className="w-16 h-16 text-slate-400" />
        <p className="text-slate-300 text-lg font-medium">{document.file_name}</p>
        <p className="text-slate-400 text-sm">This file type cannot be previewed</p>
        <div className="flex space-x-3">
          <Button onClick={handleOpenInNewTab} leftIcon={<ExternalLink className="w-4 h-4" />}>
            Open in New Tab
          </Button>
          <Button onClick={handleDownload} leftIcon={<Download className="w-4 h-4" />} variant="outline">
            Download
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={document.file_name}
      size="lg"
      footer={
        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={handleCopyLink}
            leftIcon={<Copy className="w-4 h-4" />}
          >
            Copy Link
          </Button>
          <Button
            variant="outline"
            onClick={handleDownload}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Download
          </Button>
          <Button
            onClick={handleOpenInNewTab}
            leftIcon={<ExternalLink className="w-4 h-4" />}
          >
            Open in New Tab
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center space-x-3 bg-dark-800/50 p-3 rounded-lg">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm text-slate-300">
              <span className="font-medium">{document.file_type.replace('-', ' ')}</span>
              <span className="mx-2">•</span>
              <span>{(document.file_size / 1024).toFixed(1)} KB</span>
            </p>
            <p className="text-xs text-slate-400">
              Uploaded on {new Date(document.uploaded_on).toLocaleDateString()}
            </p>
          </div>
        </div>

        {renderDocumentContent()}
      </div>
    </Modal>
  );
}