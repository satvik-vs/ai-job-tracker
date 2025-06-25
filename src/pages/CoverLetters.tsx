import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { ProgressScreen } from '../components/ui/ProgressScreen';
import { Mail, Sparkles, Copy, Download, Send, Zap, Target, Brain, MessageSquare } from 'lucide-react';
import { useJobApplications } from '../hooks/useJobApplications';
import { useLinkedInJobs } from '../hooks/useLinkedInJobs';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const toneOptions = [
  { value: 'professional', label: 'Professional' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'enthusiastic', label: 'Enthusiastic' },
  { value: 'formal', label: 'Formal' },
  { value: 'creative', label: 'Creative' }
];

export function CoverLetters() {
  const [formData, setFormData] = useState({
    selectedJobId: '',
    companyName: '',
    jobTitle: '',
    hiringManager: '',
    tone: 'professional',
    jobDescription: '',
    personalExperience: '',
    whyCompany: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [generatedContent, setGeneratedContent] = useState('');
  
  const { applications } = useJobApplications();
  const { jobs: linkedInJobs, loading: jobsLoading } = useLinkedInJobs();

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

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent);
    toast.success('Copied to clipboard!');
  };

  const handleExport = () => {
    const blob = new Blob([generatedContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cover-letter-${formData.companyName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Content exported successfully!');
  };

  const handleCancel = () => {
    setLoading(false);
    setProgress(0);
    setTimeRemaining(0);
  };

  const handleGenerate = async () => {
    toast.error("Cover letter generation is not implemented in this version. Please use the Resume Analyzer instead.");
  };

  return (
    <>
      {loading && (
        <ProgressScreen
          type="cover-letter"
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
              <span>AI Cover Letter Generator</span>
            </h1>
            <p className="text-slate-400 mt-2 flex items-center space-x-2 text-sm lg:text-base">
              <Target className="w-4 h-4" />
              <span>Create personalized, compelling cover letters powered by Google Gemini AI</span>
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            <div className="bg-gradient-to-br from-primary-900/20 to-primary-800/20 border border-primary-600/30 rounded-lg p-3 lg:p-4">
              <div className="flex items-center space-x-2">
                <Brain className="w-4 h-4 lg:w-5 lg:h-5 text-primary-400" />
                <div>
                  <p className="text-xs lg:text-sm text-primary-300 font-medium">Google Gemini</p>
                  <p className="text-xs text-slate-400">AI Powered</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-success-900/20 to-success-800/20 border border-success-600/30 rounded-lg p-3 lg:p-4">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-4 h-4 lg:w-5 lg:h-5 text-success-400" />
                <div>
                  <p className="text-xs lg:text-sm text-success-300 font-medium">5 Tones</p>
                  <p className="text-xs text-slate-400">Available</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-secondary-900/20 to-secondary-800/20 border border-secondary-600/30 rounded-lg p-3 lg:p-4">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 lg:w-5 lg:h-5 text-secondary-400" />
                <div>
                  <p className="text-xs lg:text-sm text-secondary-300 font-medium">Personalized</p>
                  <p className="text-xs text-slate-400">Content</p>
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
          {/* Input Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="bg-gradient-to-br from-dark-800/80 to-dark-900/80 border border-slate-700/50 h-full">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Mail className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-slate-100">
                  Cover Letter Details
                </h2>
              </div>

              <div className="space-y-4 lg:space-y-6 mobile-form">
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
                    placeholder="e.g., Google"
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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Input
                    label="Hiring Manager (Optional)"
                    placeholder="e.g., John Smith"
                    value={formData.hiringManager}
                    onChange={(e) => handleInputChange('hiringManager', e.target.value)}
                    variant="glass"
                  />
                  <div className="w-full">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Tone
                    </label>
                    <select
                      value={formData.tone}
                      onChange={(e) => handleInputChange('tone', e.target.value)}
                      className="w-full px-4 py-3 bg-dark-800/30 border-slate-600/50 backdrop-blur-xl border rounded-lg focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      {toneOptions.map((option) => (
                        <option key={option.value} value={option.value} className="bg-dark-800 text-slate-100">
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <Textarea
                  label="Job Description *"
                  placeholder="Paste the job description here for AI analysis..."
                  rows={window.innerWidth < 640 ? 4 : 6}
                  value={formData.jobDescription}
                  onChange={(e) => handleInputChange('jobDescription', e.target.value)}
                  variant="glass"
                />

                <Textarea
                  label="Your Relevant Experience"
                  placeholder="Briefly describe your relevant experience and skills..."
                  rows={3}
                  value={formData.personalExperience}
                  onChange={(e) => handleInputChange('personalExperience', e.target.value)}
                  variant="glass"
                />

                <Textarea
                  label="Why This Company?"
                  placeholder="What interests you about this company specifically?"
                  rows={3}
                  value={formData.whyCompany}
                  onChange={(e) => handleInputChange('whyCompany', e.target.value)}
                  variant="glass"
                />

                <Button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-full opacity-50 cursor-not-allowed"
                  leftIcon={<Sparkles className="w-5 h-5" />}
                  variant="outline"
                >
                  Generate with Google Gemini
                </Button>
              </div>
            </Card>
          </motion.div>

          {/* Generated Letter */}
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
                    Generated Cover Letter
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
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<Send className="w-4 h-4" />}
                      className="text-xs"
                    >
                      Send
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
                      className="w-full px-4 py-3 bg-dark-800/30 border-slate-600/50 backdrop-blur-xl border rounded-lg focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-slate-100 placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 resize-none"
                      readOnly
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-96 bg-dark-900/50 rounded-xl border border-slate-700/30">
                    <div className="text-center p-6">
                      <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-slate-700 to-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mail className="w-8 h-8 lg:w-10 lg:h-10 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-300 mb-2">Coming Soon</h3>
                      <p className="text-slate-400 max-w-sm text-sm">
                        Cover letter generation is coming soon. Please use the Resume Analyzer in the meantime.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Google Gemini Integration Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="bg-gradient-to-r from-primary-900/20 to-secondary-900/20 border border-primary-600/30">
            <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center space-x-2">
              <Zap className="w-5 h-5 text-primary-400" />
              <span>🔗 Google Gemini AI Integration</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-slate-300">
              <div>
                <h4 className="font-medium text-slate-200 mb-2">How it works:</h4>
                <ul className="space-y-1 text-slate-400">
                  <li>• Sends data to Google Gemini API</li>
                  <li>• AI processes job requirements</li>
                  <li>• Generates personalized content</li>
                  <li>• Returns optimized cover letter</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-slate-200 mb-2">Features:</h4>
                <ul className="space-y-1 text-slate-400">
                  <li>• 5 different tone options</li>
                  <li>• Company-specific customization</li>
                  <li>• Experience integration</li>
                  <li>• Professional formatting</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-slate-200 mb-2">Processing:</h4>
                <ul className="space-y-1 text-slate-400">
                  <li>• 30-second generation</li>
                  <li>• Real-time progress tracking</li>
                  <li>• Instant copy & export</li>
                  <li>• Ready-to-send format</li>
                </ul>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </>
  );
}