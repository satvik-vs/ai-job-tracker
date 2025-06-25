import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { DocumentViewer } from '../components/documents/DocumentViewer';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Upload, File, Download, Trash2, Search, Plus, FileText, Award, FolderOpen } from 'lucide-react';
import { useDocuments } from '../hooks/useDocuments';
import { useJobApplications } from '../hooks/useJobApplications';
import { Database } from '../lib/database.types';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

const fileTypeIcons = {
  'resume': FileText,
  'cover-letter': FileText,
  'certificate': Award,
  'other': File
};

const fileTypeColors = {
  'resume': 'primary',
  'cover-letter': 'secondary',
  'certificate': 'success',
  'other': 'default'
} as const;

const fileTypeOptions = [
  { value: '', label: 'All Types' },
  { value: 'resume', label: 'Resumes' },
  { value: 'cover-letter', label: 'Cover Letters' },
  { value: 'certificate', label: 'Certificates' },
  { value: 'other', label: 'Other' }
];

export function Documents() {
  const { documents, loading, error, uploadDocument, deleteDocument } = useDocuments();
  const { applications } = useJobApplications();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [uploadType, setUploadType] = useState<Database['public']['Tables']['documents']['Row']['file_type']>('resume');
  const [viewingDocument, setViewingDocument] = useState<Database['public']['Tables']['documents']['Row'] | null>(null);
  const [linkedJobId, setLinkedJobId] = useState<string>('');

  const jobOptions = [
    { value: '', label: 'No linked job' },
    ...applications.map(app => ({
      value: app.id,
      label: `${app.company_name} - ${app.job_title}`
    }))
  ];

  const uploadTypeOptions = [
    { value: 'resume', label: 'Resume' },
    { value: 'cover-letter', label: 'Cover Letter' },
    { value: 'certificate', label: 'Certificate' },
    { value: 'other', label: 'Other' }
  ];

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.file_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !selectedType || doc.file_type === selectedType;
    return matchesSearch && matchesType;
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    try {
      for (const file of Array.from(files)) {
        await uploadDocument(file, uploadType, linkedJobId || undefined);
      }
    } catch (error) {
      // Error handled in hook
    }
    
    event.target.value = '';
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      await deleteDocument(id);
    }
  };

  const handleViewDocument = (document: Database['public']['Tables']['documents']['Row']) => {
    setViewingDocument(document);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading your documents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 bg-error-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="w-8 h-8 text-error-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-300 mb-2">Failed to Load Documents</h3>
          <p className="text-slate-400 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} variant="primary">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">
            Document Vault
          </h1>
          <p className="text-gray-400 mt-1">
            Store and manage your resumes, certificates, and other documents
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <input
            type="file"
            id="file-upload"
            multiple
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            onClick={() => document.getElementById('file-upload')?.click()}
            leftIcon={<Upload className="w-4 h-4" />}
          >
            Upload Documents
          </Button>
        </div>
      </motion.div>

      {/* Upload Configuration */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">
            Upload Settings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="w-full">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Document Type
              </label>
              <select
                value={uploadType}
                onChange={(e) => setUploadType(e.target.value as any)}
                className="w-full px-4 py-3 bg-dark-800/70 border-slate-600 border rounded-lg focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {uploadTypeOptions.map((option) => (
                  <option key={option.value} value={option.value} className="bg-dark-800 text-slate-100">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Link to Job Application (Optional)
              </label>
              <select
                value={linkedJobId}
                onChange={(e) => setLinkedJobId(e.target.value)}
                className="w-full px-4 py-3 bg-dark-800/70 border-slate-600 border rounded-lg focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {jobOptions.map((option) => (
                  <option key={option.value} value={option.value} className="bg-dark-800 text-slate-100">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Search and Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Input
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  leftIcon={<Search className="w-4 h-4" />}
                  className="w-64"
                />
              </div>
              
              <div className="w-full">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-800/70 border-slate-600 border rounded-lg focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {fileTypeOptions.map((option) => (
                    <option key={option.value} value={option.value} className="bg-dark-800 text-slate-100">
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="text-sm text-gray-400">
              {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDocuments.map((document, index) => {
          const IconComponent = fileTypeIcons[document.file_type];
          const linkedJob = applications.find(app => app.id === document.linked_job_id);
          
          return (
            <motion.div
              key={document.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card hover>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                      <IconComponent className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-white text-sm">
                        {document.file_name}
                      </h3>
                      <p className="text-xs text-gray-400">
                        {formatFileSize(document.file_size)}
                      </p>
                    </div>
                  </div>
                  <Badge variant={fileTypeColors[document.file_type]} size="sm">
                    {document.file_type.replace('-', ' ')}
                  </Badge>
                </div>

                {linkedJob && (
                  <div className="text-xs text-blue-400 mb-2">
                    Linked to: {linkedJob.company_name} - {linkedJob.job_title}
                  </div>
                )}

                <div className="text-xs text-gray-400 mb-4">
                  Uploaded {format(new Date(document.uploaded_on), 'MMM dd, yyyy')}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDocument(document)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(document.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredDocuments.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-12"
        >
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <FolderOpen className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">
            {searchTerm || selectedType ? 'No documents found' : 'No documents yet'}
          </h3>
          <p className="text-gray-400 text-center mb-4">
            {searchTerm || selectedType 
              ? 'Try adjusting your search or filter criteria'
              : 'Upload your first document to get started'
            }
          </p>
          {!searchTerm && !selectedType && (
            <Button
              onClick={() => document.getElementById('file-upload')?.click()}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Upload Document
            </Button>
          )}
        </motion.div>
      )}
      
      {/* Document Viewer Modal */}
      {viewingDocument && (
        <DocumentViewer
          isOpen={!!viewingDocument}
          onClose={() => setViewingDocument(null)}
          document={viewingDocument}
        />
      )}
    </div>
  );
}