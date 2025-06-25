import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { X, Download, Copy, FileText, File } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DocumentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  document: {
    id: string;
    file_name: string;
    file_type: string;
    file_url: string;
  };
}

export function DocumentViewer({ isOpen, onClose, document }: DocumentViewerProps) {
  const [loading, setLoading] = useState(true);

  // Function to handle document download
  const handleDownload = () => {
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = document.file_url;
    link.download = document.file_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Function to handle document copy link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(document.file_url);
    // Show toast or notification
    alert('Document link copied to clipboard!');
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
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      );
    }

    // For PDF files
    if (fileExtension === 'pdf') {
      return (
        <iframe 
          src={document.file_url} 
          className="w-full h-full rounded-lg"
          onLoad={() => setLoading(false)}
        />
      );
    }

    // For image files
    if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
      return (
        <img 
          src={document.file_url} 
          alt={document.file_name} 
          className="max-w-full max-h-full object-contain"
          onLoad={() => setLoading(false)}
        />
      );
    }

    // For text files
    if (['txt', 'md', 'html', 'css', 'js', 'json'].includes(fileExtension)) {
      return (
        <div className="bg-dark-800 p-4 rounded-lg overflow-auto h-full">
          <pre className="text-slate-300 whitespace-pre-wrap">
            {/* In a real implementation, you would fetch and display the text content */}
            {`This is a placeholder for the content of ${document.file_name}.
            
In a production environment, the actual text content would be displayed here.`}
          </pre>
        </div>
      );
    }

    // Default fallback
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <File className="w-24 h-24 text-slate-400 mb-4" />
        <p className="text-slate-300 text-lg font-medium mb-2">{document.file_name}</p>
        <p className="text-slate-400 text-sm mb-4">This file type cannot be previewed</p>
        <Button onClick={handleDownload} leftIcon={<Download className="w-4 h-4" />}>
          Download to View
        </Button>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
              onClick={onClose}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative inline-block w-full max-w-4xl bg-dark-800/95 backdrop-blur-xl rounded-xl text-left overflow-hidden shadow-dark-lg transform transition-all my-8 mx-auto border border-slate-700/50 h-[80vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-700/50 bg-dark-800/50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-100 truncate max-w-md">
                      {document.file_name}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {document.file_type.replace('-', ' ')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyLink}
                    leftIcon={<Copy className="w-4 h-4" />}
                  >
                    Copy Link
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    leftIcon={<Download className="w-4 h-4" />}
                  >
                    Download
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-dark-700/50"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Document Content */}
              <div className="flex-1 overflow-auto p-4">
                {renderDocumentContent()}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}