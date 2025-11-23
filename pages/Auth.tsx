import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  OAuthProvider, 
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth';
import { auth } from '../services/firebase';
import { GoogleIcon, AppleIcon, PhoneIcon, MailIcon } from '../components/Icons';

// Define window interface to include recaptchaVerifier
declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier | undefined;
  }
}

const AuthPage = () => {
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [isLogin, setIsLogin] = useState(true);
  
  // Email State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Phone State
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationId, setVerificationId] = useState<ConfirmationResult | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Cleanup recaptcha on unmount
    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = undefined;
      }
    };
  }, []);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!auth) {
      setError('Authentication service is unavailable.');
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      navigate('/');
    } catch (err: any) {
      console.error("Auth Error:", err.code, err.message);
      setError(formatErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const setupRecaptcha = () => {
    if (!auth) return;
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': () => {
          // reCAPTCHA solved
        }
      });
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    if (!auth) {
      setError('Authentication service is unavailable.');
      setLoading(false);
      return;
    }

    if (phoneNumber.length < 10) {
      setError('Please enter a valid phone number.');
      setLoading(false);
      return;
    }

    try {
      setupRecaptcha();
      const appVerifier = window.recaptchaVerifier;
      if (appVerifier) {
        const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
        setVerificationId(confirmationResult);
        setOtpSent(true);
      }
    } catch (err: any) {
      console.error(err);
      setError(formatErrorMessage(err.code));
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = undefined;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!verificationId) {
      setError('Session expired. Please request a new code.');
      setLoading(false);
      return;
    }

    try {
      await verificationId.confirm(otp);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError('Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (providerName: 'google' | 'apple') => {
    setError('');
    if (!auth) {
      setError('Authentication service is unavailable.');
      return;
    }

    try {
      let provider;
      if (providerName === 'google') {
        provider = new GoogleAuthProvider();
      } else {
        provider = new OAuthProvider('apple.com');
      }
      await signInWithPopup(auth, provider);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(formatErrorMessage(err.code));
    }
  };

  const formatErrorMessage = (code: string) => {
    switch (code) {
      case 'auth/invalid-email': 
        return 'Invalid email address format.';
      case 'auth/user-disabled': 
        return 'This account has been disabled. Please contact support.';
      case 'auth/user-not-found': 
        return 'No account found with this email. Please Create a New Account.';
      case 'auth/wrong-password': 
        return 'Incorrect password. Please try again.';
      case 'auth/invalid-credential': 
      case 'auth/invalid-login-credentials':
        // This is the common error for both "User Not Found" and "Wrong Password" in newer Firebase versions
        return isLogin 
          ? 'Login failed. Incorrect email/password or account does not exist. Please create an account.' 
          : 'Could not create account with these credentials. Try a different email.';
      case 'auth/email-already-in-use': 
        return 'This email is already registered. Please Sign In instead.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters.';
      case 'auth/quota-exceeded': 
        return 'SMS quota exceeded for today. Please try another method.';
      case 'auth/popup-closed-by-user': 
        return 'Sign in was cancelled.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection.';
      default: 
        return `An error occurred (${code}). Please try again.`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h2 className="text-4xl font-black text-brand-dark tracking-tighter mb-2">
          As'B<span className="text-brand-red">o</span>nge
        </h2>
        <h2 className="mt-6 text-2xl font-extrabold text-gray-900">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          {isLogin ? 'Sign in to order food or send parcels' : 'Join us to get started'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-xl sm:px-10 border border-gray-100">
          
          {/* Auth Method Tabs */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              className={`flex-1 pb-4 text-sm font-medium text-center flex justify-center items-center gap-2 ${authMethod === 'email' ? 'border-b-2 border-brand-red text-brand-red' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => { setAuthMethod('email'); setError(''); }}
            >
              <MailIcon className="w-4 h-4" /> Email
            </button>
            <button
              className={`flex-1 pb-4 text-sm font-medium text-center flex justify-center items-center gap-2 ${authMethod === 'phone' ? 'border-b-2 border-brand-red text-brand-red' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => { setAuthMethod('phone'); setError(''); }}
            >
              <PhoneIcon className="w-4 h-4" /> Phone
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-md p-3 mb-6 flex flex-col">
              <span className="font-bold">Access Issue</span>
              <span>{error}</span>
            </div>
          )}

          {authMethod === 'email' ? (
            <form className="space-y-6" onSubmit={handleEmailSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email address</label>
                <div className="mt-1">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <div className="mt-1">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-dark hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-dark disabled:opacity-50 transition-colors"
              >
                {loading ? 'Processing...' : (isLogin ? 'Sign in' : 'Create account')}
              </button>

              <div className="text-center">
                <button 
                  type="button"
                  onClick={() => { setIsLogin(!isLogin); setError(''); }} 
                  className="text-sm font-medium text-brand-red hover:text-red-500"
                >
                  {isLogin ? 'No account? Create a new one' : 'Already have an account? Sign in'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div id="recaptcha-container"></div>
              
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-6">
                   <div>
                    <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">📞</span>
                      </div>
                      <input
                        type="tel"
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+27 72 123 4567"
                        className="appearance-none block w-full pl-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
                      />
                    </div>
                    <p className="mt-2 text-xs text-gray-500">We'll send you a verification code.</p>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-dark hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-dark disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Sending Code...' : 'Send Code'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Verification Code</label>
                    <div className="mt-1">
                      <input
                        type="text"
                        required
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="123456"
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm tracking-widest text-center text-xl"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-dark hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-dark disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Verifying...' : 'Verify & Sign In'}
                  </button>
                  <div className="text-center">
                    <button 
                      type="button"
                      onClick={() => { setOtpSent(false); setOtp(''); }}
                      className="text-sm font-medium text-gray-600 hover:text-gray-900"
                    >
                      Change Phone Number
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                onClick={() => handleSocialLogin('google')}
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
              >
                <GoogleIcon className="w-5 h-5" />
                <span className="sr-only">Sign in with Google</span>
              </button>
              <button
                 onClick={() => handleSocialLogin('apple')}
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
              >
                <AppleIcon className="w-5 h-5" />
                <span className="sr-only">Sign in with Apple</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AuthPage;