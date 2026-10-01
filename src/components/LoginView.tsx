import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  Lock,
  Mail,
  User,
  ArrowRight,
  Key,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Clock,
  Send,
  Building,
  UserPlus,
  Download,
  FileText,
} from 'lucide-react';
import { UserProfile } from '../types';
import { signInWithGoogle } from '../firebase';

interface LoginViewProps {
  onLoginSuccess: (user: UserProfile, token: string) => void;
  onOpenReadme?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, onOpenReadme }) => {
  // Primary auth tabs:
  // 'local_pwd' (Password Login)
  // 'email_otp' (Email with OTP Verification)
  // 'register' (New Account Registration)
  const [authTab, setAuthTab] = useState<'local_pwd' | 'email_otp' | 'register'>('local_pwd');

  // Local Password Form
  const [localIdentifier, setLocalIdentifier] = useState('');
  const [localPassword, setLocalPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Email OTP Form
  const [otpEmail, setOtpEmail] = useState('');
  const [otpStep, setOtpStep] = useState<'request' | 'verify'>('request');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [otpCountdown, setOtpCountdown] = useState<number>(0);

  // Register Form
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regDepartment, setRegDepartment] = useState('PAM Operations');

  // Status & feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Email Status & App Password config state
  const [emailStatus, setEmailStatus] = useState<{
    hasGmailOAuthToken: boolean;
    hasCustomSmtp: boolean;
    smtpUser: string | null;
    adminEmail: string;
  }>({
    hasGmailOAuthToken: false,
    hasCustomSmtp: false,
    smtpUser: null,
    adminEmail: '1393ndsd@gmail.com',
  });
  const [showSmtpModal, setShowSmtpModal] = useState(false);
  const [smtpPass, setSmtpPass] = useState('');
  const [smtpUser, setSmtpUser] = useState('1393ndsd@gmail.com');

  // Fetch email status on mount
  const checkEmailStatus = async () => {
    try {
      const res = await fetch('/api/settings/email-status');
      if (res.ok) {
        const data = await res.json();
        setEmailStatus(data);
      }
    } catch (e) {
      // Ignore background check failure
    }
  };

  useEffect(() => {
    checkEmailStatus();
  }, []);

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smtpUser || !smtpPass) {
      setErrorMessage('Please provide both Gmail address and 16-character App Password.');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/settings/smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: 'smtp.gmail.com',
          port: 465,
          user: smtpUser.trim(),
          pass: smtpPass.trim(),
          secure: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save SMTP settings.');
      setSuccessMessage(`Gmail App Password configured successfully for ${smtpUser.trim()}! Real email dispatch is active.`);
      setShowSmtpModal(false);
      setSmtpPass('');
      checkEmailStatus();
    } catch (err: any) {
      setErrorMessage(err.message || 'SMTP configuration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Ref for OTP inputs
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // OTP Countdown ticker
  useEffect(() => {
    if (otpCountdown <= 0) return;
    const timer = setInterval(() => {
      setOtpCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCountdown]);

  // 1. Handle Password Login
  const handleLocalPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!localIdentifier.trim()) {
      setErrorMessage('Please enter your email address or username.');
      return;
    }
    if (!localPassword) {
      setErrorMessage('Please enter your account password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: localIdentifier.trim(),
          password: localPassword,
          authMethod: 'local',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed. Please verify credentials.');
      }

      setSuccessMessage(`Authenticated successfully as ${data.user.name}. Redirecting...`);
      setTimeout(() => {
        onLoginSuccess(data.user, data.token);
      }, 350);
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to authenticate. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Handle OTP Send (Request OTP)
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpEmail.trim() || !otpEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: otpEmail.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send verification code.');
      }

      setOtpStep('verify');
      setOtpCountdown(60);
      setSuccessMessage(`A 6-digit verification code has been dispatched to ${data.email}. Please check your email inbox.`);
      setOtpCode(['', '', '', '', '', '']);

      // Focus first OTP field
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send OTP code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2b. Handle OTP Verification
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = otpCode.join('').trim();
    if (fullCode.length !== 6) {
      setErrorMessage('Please enter the complete 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: otpEmail.trim(),
          otp: fullCode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid or expired verification code.');
      }

      if (data.pendingApproval) {
        setSuccessMessage(data.message || 'Verification confirmed! Your account setup is now pending confirmation.');
        setOtpStep('request');
        return;
      }

      setSuccessMessage(`Verification confirmed! Signing into VaultDesk as ${data.user.name}...`);
      setTimeout(() => {
        onLoginSuccess(data.user, data.token);
      }, 400);
    } catch (err: any) {
      setErrorMessage(err.message || 'OTP verification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper: OTP digit input handler
  const handleOtpDigitChange = (index: number, val: string) => {
    const cleanVal = val.replace(/\D/g, '');
    if (!cleanVal) {
      const newCode = [...otpCode];
      newCode[index] = '';
      setOtpCode(newCode);
      return;
    }

    // Support pasting full 6 digits
    if (cleanVal.length > 1) {
      const digits = cleanVal.slice(0, 6).split('');
      const newCode = [...otpCode];
      digits.forEach((d, i) => {
        if (i < 6) newCode[i] = d;
      });
      setOtpCode(newCode);
      const nextIndex = Math.min(digits.length, 5);
      otpInputRefs.current[nextIndex]?.focus();
      return;
    }

    const newCode = [...otpCode];
    newCode[index] = cleanVal;
    setOtpCode(newCode);

    if (index < 5 && cleanVal) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // 3. Handle Account Registration
  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      setErrorMessage('Please fill in all required registration fields.');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName.trim(),
          email: regEmail.trim(),
          password: regPassword,
          department: regDepartment.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit registration.');
      }

      if (!data.pendingApproval && data.token && data.user) {
        setSuccessMessage(`Account created! Signing in as ${data.user.name}...`);
        setTimeout(() => {
          onLoginSuccess(data.user, data.token);
        }, 400);
        return;
      }

      setSuccessMessage(
        'Registration submitted successfully! Approval alert sent to administrator at 1393ndsd@gmail.com.'
      );
      setRegPassword('');
      setRegName('');
      setRegEmail('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration request failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Google Sign-In & Gmail API Sync Handler
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const result = await signInWithGoogle();
      if (result && result.user) {
        const email = result.user.email || '1393ndsd@gmail.com';
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': result.accessToken ? `Bearer ${result.accessToken}` : '',
          },
          body: JSON.stringify({
            email,
            authMethod: 'google',
          }),
        });
        const data = await res.json();
        if (res.ok && data.user) {
          setSuccessMessage(`Google Authentication confirmed for ${email}! Active Gmail API dispatch enabled.`);
          setTimeout(() => {
            onLoginSuccess(data.user, data.token);
          }, 350);
        } else {
          throw new Error(data.error || 'Unable to authenticate with Google Account.');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Google authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-[#F5F6F8] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans selection:bg-[#0A84FF] selection:text-white">
      {/* Subtle ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-[#0A84FF]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-8 right-12 w-[350px] h-[350px] bg-[#00A896]/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center space-y-3">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0A84FF] via-[#00A896] to-[#64D2FF] text-white shadow-xl shadow-[#0A84FF]/25 mx-auto ring-1 ring-white/20">
          <ShieldAlert className="w-8 h-8 text-black" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[#F5F6F8] font-sans">
            Vault<span className="text-[#0A84FF]">Desk</span>
          </h1>
          <p className="text-xs font-semibold text-[#00A896] tracking-wide mt-1 uppercase">
            Privileged Access Management Portal
          </p>
        </div>
      </div>

      {/* Main Authentication Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg relative z-10">
        <div className="bg-[#12151F] border border-[#232833] rounded-3xl shadow-[0_24px_64px_rgba(0,0,0,0.7)] p-6 sm:p-8 space-y-6 backdrop-blur-xl">
          
          {/* Main Navigation Tabs */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-[#0E1017] border border-[#232833] rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setAuthTab('local_pwd');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                authTab === 'local_pwd'
                  ? 'bg-[#1E2332] text-[#0A84FF] shadow-sm font-bold border border-white/5'
                  : 'text-[#8E9BBA] hover:text-white'
              }`}
            >
              <Key className="w-3.5 h-3.5 shrink-0 text-[#0A84FF]" />
              <span className="truncate">Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthTab('email_otp');
                setErrorMessage(null);
                setSuccessMessage(null);
                if (!otpEmail && localIdentifier.includes('@')) {
                  setOtpEmail(localIdentifier);
                }
              }}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                authTab === 'email_otp'
                  ? 'bg-[#1E2332] text-[#30D158] shadow-sm font-bold border border-white/5'
                  : 'text-[#8E9BBA] hover:text-white'
              }`}
            >
              <Mail className="w-3.5 h-3.5 shrink-0 text-[#30D158]" />
              <span className="truncate">Email OTP</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthTab('register');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                authTab === 'register'
                  ? 'bg-[#1E2332] text-[#00A896] shadow-sm font-bold border border-white/5'
                  : 'text-[#8E9BBA] hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5 shrink-0 text-[#00A896]" />
              <span className="truncate">Register</span>
            </button>
          </div>

          {/* Feedback Banners */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-[#2A1414] border border-[#FF453A]/40 text-xs text-[#FF453A] flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-[#12241A] border border-[#30D158]/40 text-xs text-[#30D158] flex items-start gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{successMessage}</div>
            </div>
          )}

          {/* =========================================================================
              TAB 1: PASSWORD LOGIN
             ========================================================================= */}
          {authTab === 'local_pwd' && (
            <form onSubmit={handleLocalPasswordLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#8E9BBA] block">
                  Email Address or Username
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-[#6E7787]" />
                  <input
                    type="text"
                    value={localIdentifier}
                    onChange={(e) => setLocalIdentifier(e.target.value)}
                    placeholder="Enter email address or username"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-[#0E1017] border border-[#2E3440] text-white placeholder-[#6E7787] text-sm focus:outline-none focus:border-[#0A84FF] transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#8E9BBA] block">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthTab('email_otp');
                      if (localIdentifier.includes('@')) setOtpEmail(localIdentifier);
                    }}
                    className="text-[11px] text-[#0A84FF] hover:underline cursor-pointer"
                  >
                    Login with Email OTP?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-[#6E7787]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={localPassword}
                    onChange={(e) => setLocalPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-[#0E1017] border border-[#2E3440] text-white placeholder-[#6E7787] text-sm focus:outline-none focus:border-[#0A84FF] transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-[#6E7787] hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-2xl bg-[#0A84FF] hover:bg-[#3B9EFF] disabled:opacity-50 text-white font-bold text-sm transition-all shadow-[0_4px_16px_rgba(10,132,255,0.3)] flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center text-xs text-[#8E9BBA]">
                <span>Don't have an account? </span>
                <button
                  type="button"
                  onClick={() => setAuthTab('register')}
                  className="text-[#00A896] font-semibold hover:underline cursor-pointer"
                >
                  Create an Account
                </button>
              </div>

              {/* Official Google Sign-In & Gmail API Sync Button */}
              <div className="pt-2">
                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-[#232833]"></div>
                  <span className="flex-shrink mx-3 text-[10px] text-[#6E7787] uppercase font-bold tracking-wider">Or</span>
                  <div className="flex-grow border-t border-[#232833]"></div>
                </div>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full mt-1 py-2.5 px-4 rounded-2xl bg-[#0E1017] hover:bg-[#1E2332] border border-[#2E3440] hover:border-[#0A84FF]/50 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.99] shadow-sm"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                  <span>Sign in with Google (Admin Gmail API)</span>
                </button>
              </div>
            </form>
          )}

          {/* =========================================================================
              TAB 2: LOGIN VIA EMAIL WITH OTP VERIFICATION
             ========================================================================= */}
          {authTab === 'email_otp' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-[#0E1017] border border-[#232833] text-xs space-y-1">
                <div className="flex items-center gap-2 text-[#30D158] font-bold">
                  <Mail className="w-4 h-4" />
                  <span>Passwordless Email OTP Verification</span>
                </div>
                <p className="text-[11px] text-[#8E9BBA]">
                  Authenticate securely using a single-use 6-digit verification code sent directly to your email address.
                </p>
              </div>

              {otpStep === 'request' ? (
                /* Step 1: Request Email OTP */
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#8E9BBA] block">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 w-4 h-4 text-[#6E7787]" />
                      <input
                        type="email"
                        value={otpEmail}
                        onChange={(e) => setOtpEmail(e.target.value)}
                        placeholder="Enter corporate email address"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-[#0E1017] border border-[#2E3440] text-white placeholder-[#6E7787] text-sm focus:outline-none focus:border-[#30D158] transition-all"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-2xl bg-[#30D158] hover:bg-[#28B84D] disabled:opacity-50 text-[#0B0E14] font-bold text-sm transition-all shadow-[0_4px_16px_rgba(48,209,88,0.3)] flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Sending Code to Email...</span>
                      </span>
                    ) : (
                      <>
                        <span>Send Verification Code</span>
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="pt-2 text-center text-xs text-[#8E9BBA]">
                    <span>Prefer entering your password? </span>
                    <button
                      type="button"
                      onClick={() => setAuthTab('local_pwd')}
                      className="text-[#0A84FF] font-semibold hover:underline cursor-pointer"
                    >
                      Login with password
                    </button>
                  </div>
                </form>
              ) : (
                /* Step 2: Enter & Verify 6-digit OTP */
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#8E9BBA]">
                      Verification code sent to: <strong className="text-white font-mono">{otpEmail}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setOtpStep('request');
                        setErrorMessage(null);
                      }}
                      className="text-[#0A84FF] hover:underline cursor-pointer text-xs"
                    >
                      Change
                    </button>
                  </div>

                  {/* 6-Digit Segmented Code Input */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#8E9BBA] text-center block">
                      Enter 6-Digit Code
                    </label>
                    <div className="flex justify-center gap-2 sm:gap-3">
                      {otpCode.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => {
                            otpInputRefs.current[index] = el;
                          }}
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={digit}
                          onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(index, e)}
                          className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold font-mono rounded-2xl bg-[#0E1017] border border-[#2E3440] text-white focus:border-[#30D158] focus:ring-2 focus:ring-[#30D158]/20 focus:outline-none transition-all"
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || otpCode.join('').length !== 6}
                    className="w-full py-3 rounded-2xl bg-[#30D158] hover:bg-[#28B84D] disabled:opacity-50 text-[#0B0E14] font-bold text-sm transition-all shadow-[0_4px_16px_rgba(48,209,88,0.3)] flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Verifying Code...</span>
                      </span>
                    ) : (
                      <>
                        <span>Verify Code & Sign In</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  {/* Resend Timer */}
                  <div className="flex items-center justify-between pt-2 text-xs text-[#8E9BBA]">
                    <span>Didn't receive the email?</span>
                    {otpCountdown > 0 ? (
                      <span className="text-[#6E7787] font-mono flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Resend in {otpCountdown}s</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={isLoading}
                        className="text-[#30D158] font-bold hover:underline cursor-pointer"
                      >
                        Resend code
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>
          )}

          {/* =========================================================================
              TAB 3: REGISTER NEW ACCOUNT
             ========================================================================= */}
          {authTab === 'register' && (
            <form onSubmit={handleRegisterUser} className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">Create an Account</h3>
                <p className="text-xs text-[#8E9BBA]">
                  Enter your details to register for a VaultDesk portal account.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#8E9BBA] block">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-[#6E7787]" />
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-[#0E1017] border border-[#2E3440] text-white placeholder-[#6E7787] text-sm focus:outline-none focus:border-[#00A896]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#8E9BBA] block">
                  Corporate Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-[#6E7787]" />
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-[#0E1017] border border-[#2E3440] text-white placeholder-[#6E7787] text-sm focus:outline-none focus:border-[#00A896]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#8E9BBA] block">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-[#6E7787]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-[#0E1017] border border-[#2E3440] text-white placeholder-[#6E7787] text-sm focus:outline-none focus:border-[#00A896]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-[#6E7787] hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#8E9BBA] block">
                    Department
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3.5 top-3 w-4 h-4 text-[#6E7787]" />
                    <input
                      type="text"
                      value={regDepartment}
                      onChange={(e) => setRegDepartment(e.target.value)}
                      placeholder="e.g. Operations"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-[#0E1017] border border-[#2E3440] text-white placeholder-[#6E7787] text-sm focus:outline-none focus:border-[#00A896]"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-2xl bg-[#00A896] hover:bg-[#008f81] disabled:opacity-50 text-white font-bold text-sm transition-all shadow-[0_4px_16px_rgba(0,168,150,0.3)] flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Submitting Registration...</span>
                  </span>
                ) : (
                  <>
                    <span>Submit Registration</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center text-xs text-[#8E9BBA]">
                <span>Already have an account? </span>
                <button
                  type="button"
                  onClick={() => setAuthTab('local_pwd')}
                  className="text-[#0A84FF] font-semibold hover:underline cursor-pointer"
                >
                  Sign in
                </button>
              </div>
            </form>
          )}

          {/* Documentation & README.md Action */}
          <div className="pt-3 border-t border-[#232833]">
            <div className="p-3 rounded-2xl bg-[#0E1017] border border-[#232833] flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-[#8E9BBA] min-w-0">
                <FileText className="w-4 h-4 text-[#0A84FF] shrink-0" />
                <span className="truncate">Need local setup & GitHub install guide?</span>
              </div>
              <button
                type="button"
                onClick={onOpenReadme}
                className="px-3 py-1.5 rounded-xl bg-[#0A84FF]/10 hover:bg-[#0A84FF]/20 text-[#0A84FF] border border-[#0A84FF]/30 font-semibold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                title="View formatted README.md"
              >
                <Download className="w-3.5 h-3.5" />
                <span>README</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 text-center text-xs text-[#6E7787]">
          Protected by VaultDesk Role-Based Access Control (RBAC) & TLS Encrypted Session Tokens.
        </div>
      </div>
    </div>
  );
};
