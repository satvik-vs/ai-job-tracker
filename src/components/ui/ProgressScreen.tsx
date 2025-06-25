import React from 'react';
import { Card } from './Card';
import { Sparkles, Clock, Zap, Brain, Cpu, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProgressScreenProps {
  type: 'resume' | 'cover-letter';
  progress: number;
  timeRemaining: number;
  onCancel?: () => void;
}

export function ProgressScreen({ type, progress, timeRemaining, onCancel }: ProgressScreenProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressMessage = () => {
    if (progress < 20) return 'Analyzing job requirements...';
    if (progress < 40) return 'Processing with AI models...';
    if (progress < 60) return 'Optimizing content structure...';
    if (progress < 80) return 'Applying ATS optimization...';
    if (progress < 95) return 'Finalizing suggestions...';
    return 'Almost ready!';
  };

  const getProgressIcon = () => {
    if (progress < 20) return <FileText className="w-6 h-6" />;
    if (progress < 40) return <Brain className="w-6 h-6" />;
    if (progress < 60) return <Cpu className="w-6 h-6" />;
    if (progress < 80) return <Zap className="w-6 h-6" />;
    return <Sparkles className="w-6 h-6" />;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <Card className="bg-gradient-to-br from-dark-800/95 to-dark-900/95 border border-primary-500/30 backdrop-blur-xl">
          <div className="text-center p-8">
            {/* Header */}
            <div className="mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-glow">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-10 h-10 text-white" />
                </motion.div>
              </div>
              <h2 className="text-2xl font-bold text-slate-100 mb-2">
                Generating {type === 'resume' ? 'Resume Suggestions' : 'Cover Letter'}
              </h2>
              <p className="text-slate-400">
                Our AI is crafting personalized content for you
              </p>
            </div>

            {/* Progress Circle */}
            <div className="relative w-32 h-32 mx-auto mb-6">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                {/* Background circle */}
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-slate-700"
                />
                {/* Progress circle */}
                <motion.circle
                  cx="60"
                  cy="60"
                  r="54"
                  stroke="url(#gradient)"
                  strokeWidth="8"
                  fill="transparent"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 54}`}
                  strokeDashoffset={`${2 * Math.PI * 54 * (1 - progress / 100)}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 54 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 54 * (1 - progress / 100) }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
              
              {/* Progress percentage */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-100">
                    {Math.round(progress)}%
                  </div>
                  <div className="text-xs text-slate-400">
                    {formatTime(timeRemaining)}
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Message */}
            <div className="mb-6">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-primary-400"
                >
                  {getProgressIcon()}
                </motion.div>
                <span className="text-slate-300 font-medium">
                  {getProgressMessage()}
                </span>
              </div>
              
              {/* Time remaining */}
              <div className="flex items-center justify-center space-x-2 text-sm text-slate-400">
                <Clock className="w-4 h-4" />
                <span>Estimated time remaining: {formatTime(timeRemaining)}</span>
              </div>
            </div>

            {/* Processing Steps */}
            <div className="bg-dark-900/50 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-slate-300 mb-3">Processing Steps:</h3>
              <div className="space-y-2 text-xs text-slate-400">
                <div className={`flex items-center space-x-2 ${progress >= 20 ? 'text-success-400' : ''}`}>
                  <div className={`w-2 h-2 rounded-full ${progress >= 20 ? 'bg-success-400' : 'bg-slate-600'}`} />
                  <span>Job requirements analysis</span>
                </div>
                <div className={`flex items-center space-x-2 ${progress >= 40 ? 'text-success-400' : ''}`}>
                  <div className={`w-2 h-2 rounded-full ${progress >= 40 ? 'bg-success-400' : 'bg-slate-600'}`} />
                  <span>n8n workflow processing</span>
                </div>
                <div className={`flex items-center space-x-2 ${progress >= 60 ? 'text-success-400' : ''}`}>
                  <div className={`w-2 h-2 rounded-full ${progress >= 60 ? 'bg-success-400' : 'bg-slate-600'}`} />
                  <span>Content optimization</span>
                </div>
                <div className={`flex items-center space-x-2 ${progress >= 80 ? 'text-success-400' : ''}`}>
                  <div className={`w-2 h-2 rounded-full ${progress >= 80 ? 'bg-success-400' : 'bg-slate-600'}`} />
                  <span>ATS compatibility check</span>
                </div>
                <div className={`flex items-center space-x-2 ${progress >= 95 ? 'text-success-400' : ''}`}>
                  <div className={`w-2 h-2 rounded-full ${progress >= 95 ? 'bg-success-400' : 'bg-slate-600'}`} />
                  <span>Final review and formatting</span>
                </div>
              </div>
            </div>

            {/* Cancel Button */}
            {onCancel && (
              <button
                onClick={onCancel}
                className="text-slate-400 hover:text-slate-300 text-sm transition-colors"
              >
                Cancel Generation
              </button>
            )}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}