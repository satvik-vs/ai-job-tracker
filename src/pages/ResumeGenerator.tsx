import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Textarea';
import { Input } from '../components/ui/Input'; 
import { ProgressScreen } from '../components/ui/ProgressScreen';
import { FileText, Sparkles, Copy, Download, Zap, Target, Brain, TrendingUp, Upload, Settings } from 'lucide-react';
import { useJobApplications } from '../hooks/useJobApplications';
import { useLinkedInJobs } from '../hooks/useLinkedInJobs';
import { useDocuments } from '../hooks/useDocuments';
import { useOpenRouterAI } from '../hooks/useOpenRouterAI';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Modal } from '../components/ui/Modal';

export function ResumeGenerator() {
  const [formData, setFormData] = useState({
    selectedJobId: '',
    selectedResumeId: '',
    companyName: '',
    jobTitle: '',
    jobDescription: ''
  });
  const [showSettings, setShowSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    apiKey: '',
    modelId: 'deepseek/deepseek-r1-0528:free'
  });
  
  const { applications } = useJobApplications();
  const { jobs: linkedInJobs, loading: jobsLoading } = useLinkedInJobs();
  const { documents } = useDocuments();
  const { 
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
  } = useOpenRouterAI();

  // Filter documents to only show resumes
  const resumeDocuments = documents.filter(doc => doc.file_type === 'resume');

  // Combine job applications and LinkedIn jobs for the dropdown
  const allJobOptions = [
    { value: '', label: 'Select a job...' },
    // Job Applications
    ...applications.map(app => ({
      value: `app_${app.id}`,
      label: `📋 ${app.company_name} - ${app.job_title}`,
      type: 'application',
      data: app
    })),
    // LinkedIn Jobs
    ...linkedInJobs.map(job => ({
      value: `linkedin_${job.id}`,
      label: `💼 ${job.company_name} - ${job.title}`,
      type: 'linkedin',
      data: job
    }))
  ];

  const resumeOptions = [
    { value: '', label: 'No resume selected (job analysis only)' },
    ...resumeDocuments.map(doc => ({
      value: doc.id,
      label: `📄 ${doc.file_name}`,
      data: doc
    }))
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-fill company and job title when job is selected
    if (field === 'selectedJobId' && value) {
      const selectedOption = allJobOptions.find(option => option.value === value);
      if (selectedOption && selectedOption.data) {
        if (selectedOption.type === 'application') {
          const app = selectedOption.data as any;
          setFormData(prev => ({
            ...prev,
            companyName: app.company_name,
            jobTitle: app.job_title,
            jobDescription: app.notes || ''
          }));
        } else if (selectedOption.type === 'linkedin') {
          const job = selectedOption.data as any;
          setFormData(prev => ({
            ...prev,
            companyName: job.company_name,
            jobTitle: job.title,
            jobDescription: job.description || ''
          }));
        }
      }
    }
  };

  const extractResumeContent = async (resumeId: string): Promise<string> => {
    const resume = resumeDocuments.find(doc => doc.id === resumeId);
    if (!resume) {
      throw new Error('Resume not found');
    }

    // If resume has content stored, use that
    if (resume.resume_content) {
      return resume.resume_content;
    }

    // Otherwise return a placeholder
    return `Resume Content for ${resume.file_name}

This is a placeholder for the actual resume content that would be extracted from the uploaded file.

In a production environment, this would contain:
- Personal information
- Professional summary
- Work experience
- Education
- Skills
- Certifications

The system would parse the actual PDF/DOC file and extract the text content for analysis.`;
  };

  const handleGenerate = async () => {
    if (!formData.companyName.trim()) {
      toast.error('Please enter a company name');
      return;
    }

    if (!formData.jobTitle.trim()) {
      toast.error('Please enter a job title');
      return;
    }

    if (!formData.jobDescription.trim()) {
      toast.error('Please enter a job description');
      return;
    }

    try {
      let resumeContent = '';
      
      // Extract resume content if a resume is selected
      if (formData.selectedResumeId) {
        try {
          resumeContent = await extractResumeContent(formData.selectedResumeId);
        } catch (error) {
          console.error('Failed to extract resume content:', error);
          toast.error('Failed to read resume content. Proceeding with job analysis only.');
        }
      }

      // Extract the actual job ID for selected_job_id
      let selectedJobId = null;
      if (formData.selectedJobId) {
        if (formData.selectedJobId.startsWith('app_')) {
          selectedJobId = formData.selectedJobId.replace('app_', '');
        } else if (formData.selectedJobId.startsWith('linkedin_')) {
          selectedJobId = formData.selectedJobId.replace('linkedin_', '');
        }
      }

      await generateContent('resume', {
        company_name: formData.companyName,
        job_title: formData.jobTitle,
        job_description: formData.jobDescription,
        selected_job_id: selectedJobId
      }, resumeContent);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent);
    toast.success('Copied to clipboard!');
  };

  const handleExport = () => {
    const blob = new Blob([generatedContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resume-analysis-${formData.companyName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Analysis exported successfully!');
  };

  const handleCancel = () => {
    resetState();
  };

  const handleSaveSettings = () => {
    updateSettings(settingsForm.apiKey, settingsForm.modelId);
    toast.success('AI settings updated');
    setShowSettings(false);
  };

  return (
    <>
      {loading && (
        <ProgressScreen
          type="resume"
          progress={progress}
          timeRemaining={timeRemaining}
          onCancel={handleCancel}
        />
      )}

      <div className="space-y-6 lg:space-y-8 mobile-spacing">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col space-y-4"
        >
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold gradient-text flex items-center space-x-2 lg:space-x-3">
              <Zap className="w-6 h-6 lg:w-8 lg:h-8 text-primary-500" />
              <span>AI Resume Analyzer</span>
            </h1>
            <p className="text-slate-400 mt-2 flex items-center space-x-2 text-sm lg:text-base">
              <Target className="w-4 h-4" />
              <span>Analyze your resume against job requirements with OpenRouter AI</span>
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            <div className="bg-gradient-to-br from-primary-900/20 to-primary-800/20 border border-primary-600/30 rounded-lg p-3 lg:p-4">
              <div className="flex items-center space-x-2">
                <Brain className="w-4 h-4 lg:w-5 lg:h-5 text-primary-400" />
                <div>
                  <p className="text-xs lg:text-sm text-primary-300 font-medium">OpenRouter</p>
                  <p className="text-xs text-slate-400">DeepSeek AI</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-success-900/20 to-success-800/20 border border-success-600/30 rounded-lg p-3 lg:p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 lg:w-5 lg:h-5 text-success-400" />
                <div>
                  <p className="text-xs lg:text-sm text-success-300 font-medium">ATS Ready</p>
                  <p className="text-xs text-slate-400">Optimized</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-secondary-900/20 to-secondary-800/20 border border-secondary-600/30 rounded-lg p-3 lg:p-4">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 lg:w-5 lg:h-5 text-secondary-400" />
                <div>
                  <p className="text-xs lg:text-sm text-secondary-300 font-medium">Resume</p>
                  <p className="text-xs text-slate-400">Analysis</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-accent-900/20 to-accent-800/20 border border-accent-600/30 rounded-lg p-3 lg:p-4">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 lg:w-5 lg:h-5 text-accent-400" />
                <div>
                  <p className="text-xs lg:text-sm text-accent-300 font-medium">30 Sec</p>
                  <p className="text-xs text-slate-400">Processing</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Input Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="bg-gradient-to-br from-dark-800/80 to-dark-900/80 border border-slate-700/50 h-full">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                  <FileText className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-slate-100 flex-1">
                  Resume & Job Analysis
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSettings(true)}
                  leftIcon={<Settings className="w-4 h-4" />}
                >
                  AI Settings
                </Button>
              </div>

              <div className="space-y-4 lg:space-y-6 mobile-form">
                <div className="w-full">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Select Resume (Optional)
                  </label>
                  <select
                    value={formData.selectedResumeId}
                    onChange={(e) => handleInputChange('selectedResumeId', e.target.value)}
                    className="w-full px-4 py-3 bg-dark-800/30 border-slate-600/50 backdrop-blur-xl border rounded-lg focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {resumeOptions.map((option) => (
                      <option key={option.value} value={option.value} className="bg-dark-800 text-slate-100">
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-400 mt-1">
                    {formData.selectedResumeId 
                      ? 'Resume will be analyzed against the job requirements' 
                      : 'Without a resume, we\'ll provide general optimization suggestions'
                    }
                  </p>
                </div>

                <div className="w-full">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Select Job (Optional)
                  </label>
                  <select
                    value={formData.selectedJobId}
                    onChange={(e) => handleInputChange('selectedJobId', e.target.value)}
                    disabled={jobsLoading}
                    className="w-full px-4 py-3 bg-dark-800/30 border-slate-600/50 backdrop-blur-xl border rounded-lg focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {allJobOptions.map((option) => (
                      <option key={option.value} value={option.value} className="bg-dark-800 text-slate-100">
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {jobsLoading && (
                    <p className="text-xs text-slate-400 mt-1">Loading LinkedIn jobs...</p>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Input
                    label="Company Name *"
                    placeholder="e.g., Google, Microsoft"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    variant="glass"
                  />
                  <Input
                    label="Job Title *"
                    placeholder="e.g., Software Engineer"
                    value={formData.jobTitle}
                    onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                    variant="glass"
                  />
                </div>

                <div className="w-full">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Job Description *
                  </label>
                  <textarea
                    rows={window.innerWidth < 640 ? 8 : 12}
                    value={formData.jobDescription}
                    onChange={(e) => handleInputChange('jobDescription', e.target.value)}
                    className="w-full px-4 py-3 bg-dark-800/30 border-slate-600/50 backdrop-blur-xl border rounded-lg focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-slate-100 placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 resize-none font-mono text-sm"
                    placeholder="Paste the complete job description here for AI analysis..."
                  />
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-full"
                  leftIcon={<Sparkles className="w-5 h-5" />}
                  glow
                >
                  Analyze with OpenRouter AI
                </Button>
              </div>
            </Card>
          </motion.div>

          {/* Output Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-dark-800/80 to-dark-900/80 border border-slate-700/50 h-full">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 space-y-3 lg:space-y-0">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Sparkles className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-100">
                    AI Analysis Results
                  </h2>
                </div>
                
                {generatedContent && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyToClipboard}
                      leftIcon={<Copy className="w-4 h-4" />}
                      className="text-xs"
                    >
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExport}
                      leftIcon={<Download className="w-4 h-4" />}
                      className="text-xs"
                    >
                      Export
                    </Button>
                  </div>
                )}
              </div>

              <div className="min-h-96">
                {generatedContent ? (
                  <div className="w-full">
                    <textarea
                      value={generatedContent}
                      onChange={(e) => setGeneratedContent(e.target.value)}
                      rows={window.innerWidth < 640 ? 15 : 20}
                      className="w-full px-4 py-3 bg-dark-800/30 border-slate-600/50 backdrop-blur-xl border rounded-lg focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-slate-100 placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 resize-none font-mono text-sm"
                      readOnly
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-96 bg-dark-900/50 rounded-xl border border-slate-700/30">
                    <div className="text-center p-6">
                      <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-slate-700 to-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 lg:w-10 lg:h-10 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-300 mb-2">Ready to Analyze</h3>
                      <p className="text-slate-400 max-w-sm text-sm">
                        Select a resume (optional) and enter a job description, then click "Analyze with OpenRouter AI" to get personalized suggestions
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        </div>

        {/* OpenRouter Integration Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="bg-gradient-to-r from-primary-900/20 to-secondary-900/20 border border-primary-600/30">
            <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center space-x-2">
              <Zap className="w-5 h-5 text-primary-400" />
              <span>🔗 OpenRouter AI Integration</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-300">
              <div>
                <h4 className="font-medium text-slate-200 mb-3 flex items-center space-x-2">
                  <span className="w-2 h-2 bg-primary-400 rounded-full"></span>
                  <span>How it works:</span>
                </h4>
                <ul className="space-y-2 text-slate-400">
                  <li className="flex items-start space-x-2">
                    <span className="text-primary-400 mt-1">•</span>
                    <span>Analyzes your resume against job requirements</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-primary-400 mt-1">•</span>
                    <span>Identifies key skills and experience gaps</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-primary-400 mt-1">•</span>
                    <span>Provides ATS optimization suggestions</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-primary-400 mt-1">•</span>
                    <span>Recommends tailored improvements</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-slate-200 mb-3 flex items-center space-x-2">
                  <span className="w-2 h-2 bg-secondary-400 rounded-full"></span>
                  <span>Features:</span>
                </h4>
                <ul className="space-y-2 text-slate-400">
                  <li className="flex items-start space-x-2">
                    <span className="text-secondary-400 mt-1">•</span>
                    <span>30-second processing time</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-secondary-400 mt-1">•</span>
                    <span>DeepSeek AI model for accurate analysis</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-secondary-400 mt-1">•</span>
                    <span>Keyword extraction and matching</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-secondary-400 mt-1">•</span>
                    <span>Professional formatting tips</span>
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
      
      {/* AI Settings Modal */}
      <Modal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        title="AI Settings"
        size="md"
        footer={
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSettings}>
              Save Settings
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              OpenRouter API Key
            </label>
            <Input
              type="password"
              value={settingsForm.apiKey}
              onChange={(e) => setSettingsForm(prev => ({ ...prev, apiKey: e.target.value }))}
              placeholder={apiKey ? "••••••••" + apiKey.slice(-4) : "Enter your OpenRouter API key"}
              variant="glass"
            />
            <p className="text-xs text-slate-400 mt-1">
              Leave blank to use the default API key
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              AI Model
            </label>
            <select
              value={settingsForm.modelId}
              onChange={(e) => setSettingsForm(prev => ({ ...prev, modelId: e.target.value }))}
              className="w-full px-4 py-3 bg-dark-800/30 border-slate-600/50 backdrop-blur-xl border rounded-lg focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <option value="deepseek/deepseek-r1-0528:free" className="bg-dark-800 text-slate-100">
                DeepSeek R1 (Default)
              </option>
              <option value="anthropic/claude-3-haiku:beta" className="bg-dark-800 text-slate-100">
                Claude 3 Haiku
              </option>
              <option value="google/gemma-7b-it:free" className="bg-dark-800 text-slate-100">
                Google Gemma 7B
              </option>
              <option value="meta-llama/llama-3-8b-instruct:free" className="bg-dark-800 text-slate-100">
                Llama 3 8B
              </option>
            </select>
            <p className="text-xs text-slate-400 mt-1">
              Select the AI model to use for analysis
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-primary-900/20 to-secondary-900/20 border border-primary-600/30 rounded-xl p-4">
            <h3 className="text-sm font-medium text-primary-300 mb-2">About OpenRouter</h3>
            <p className="text-xs text-slate-400">
              OpenRouter provides access to various AI models through a unified API. 
              You can get your own API key at <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:text-primary-300">openrouter.ai</a>.
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
}