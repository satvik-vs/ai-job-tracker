import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Sparkles, Mail, Lock, User, AlertCircle, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { testConnection } from '../../lib/supabase';
import toast from 'react-hot-toast';

export function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  const { signIn, signUp } = useAuth();

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setConnectionStatus('checking');
    const isConnected = await testConnection();
    setConnectionStatus(isConnected ? 'connected' : 'disconnected');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (connectionStatus !== 'connected') {
      toast.error('Supabase connection failed. Please check configuration.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        const { data, error } = await signUp(email, password, fullName);
        if (error) throw error;
        
        if (data.user && !data.user.email_confirmed_at) {
          toast.success('Account created! Please check your email to verify your account.');
        } else {
          toast.success('Account created successfully!');
        }
      } else {
        const { data, error } = await signIn(email, password);
        if (error) throw error;
        toast.success('Welcome back!');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      setError(error.message || 'An error occurred');
      toast.error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  // Show configuration screen if not connected
  if (connectionStatus === 'disconnected') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Settings className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">
                Configuration Required
              </h1>
              <p className="text-gray-400 mt-2">
                Please set up your Supabase connection
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-orange-900/20 border border-orange-500 rounded-lg p-4">
                <h3 className="text-orange-300 font-medium mb-2">Setup Instructions:</h3>
                <ol className="text-sm text-orange-200 space-y-1">
                  <li>1. Create a Supabase project at supabase.com</li>
                  <li>2. Copy your project URL and anon key</li>
                  <li>3. Update the .env file with your credentials</li>
                  <li>4. Restart the development server</li>
                </ol>
              </div>

              <div className="bg-gray-800 rounded-lg p-4">
                <h4 className="text-gray-300 font-medium mb-2">Environment Variables:</h4>
                <div className="space-y-2 text-sm font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">VITE_SUPABASE_URL</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      import.meta.env.VITE_SUPABASE_URL && 
                      import.meta.env.VITE_SUPABASE_URL.includes('supabase.co')
                        ? 'bg-green-900 text-green-300' 
                        : 'bg-red-900 text-red-300'
                    }`}>
                      {import.meta.env.VITE_SUPABASE_URL && 
                       import.meta.env.VITE_SUPABASE_URL.includes('supabase.co') ? 'SET' : 'MISSING'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">VITE_SUPABASE_ANON_KEY</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      import.meta.env.VITE_SUPABASE_ANON_KEY && 
                      import.meta.env.VITE_SUPABASE_ANON_KEY.startsWith('eyJ')
                        ? 'bg-green-900 text-green-300' 
                        : 'bg-red-900 text-red-300'
                    }`}>
                      {import.meta.env.VITE_SUPABASE_ANON_KEY && 
                       import.meta.env.VITE_SUPABASE_ANON_KEY.startsWith('eyJ') ? 'SET' : 'MISSING'}
                    </span>
                  </div>
                </div>
              </div>

              <Button
                onClick={checkConnection}
                className="w-full"
                leftIcon={<Settings className="w-4 h-4" />}
              >
                Test Connection
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">
              JobTracker AI
            </h1>
            <p className="text-gray-400 mt-2">
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </p>
            
            {/* Connection Status */}
            <div className="mt-4">
              <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs ${
                connectionStatus === 'connected' 
                  ? 'bg-green-900/20 text-green-300 border border-green-600/30'
                  : connectionStatus === 'checking'
                  ? 'bg-yellow-900/20 text-yellow-300 border border-yellow-600/30'
                  : 'bg-red-900/20 text-red-300 border border-red-600/30'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' 
                    ? 'bg-green-400 animate-pulse'
                    : connectionStatus === 'checking'
                    ? 'bg-yellow-400 animate-pulse'
                    : 'bg-red-400'
                }`}></div>
                <span>
                  {connectionStatus === 'connected' && 'Connected to Supabase'}
                  {connectionStatus === 'checking' && 'Checking connection...'}
                  {connectionStatus === 'disconnected' && 'Connection failed'}
                </span>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-500 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <Input
                label="Full Name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                leftIcon={<User className="w-4 h-4" />}
                required
                placeholder="Enter your full name"
              />
            )}
            
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
              placeholder="Enter your email"
            />
            
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
              placeholder="Enter your password"
              minLength={6}
            />

            <Button
              type="submit"
              className="w-full"
              isLoading={loading}
              disabled={connectionStatus !== 'connected'}
            >
              {isSignUp ? 'Create Account' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
            >
              {isSignUp 
                ? 'Already have an account? Sign in' 
                : "Don't have an account? Sign up"
              }
            </button>
          </div>

          {isSignUp && (
            <div className="mt-4 text-xs text-gray-400 text-center">
              By creating an account, you agree to our Terms of Service and Privacy Policy.
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}