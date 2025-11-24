import React, { useState } from 'react';
import { AppData } from '../types';
import { Lock, ArrowLeft, AlertCircle } from 'lucide-react';

interface LoginScreenProps {
  appData: AppData;
  onLoginSuccess: () => void;
  onBack: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ appData, onLoginSuccess, onBack }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (password === appData.adminPass) {
      onLoginSuccess();
    } else {
      setError('Incorrect password');
      setPassword('');
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[radial-gradient(circle_at_center,_#1a1a1a_0%,_#000000_100%)] p-6">
      <div className="w-full max-w-sm bg-[#111] border border-[#333] rounded-2xl p-8 shadow-2xl animate-pop-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#00FF00]/10 text-[#00FF00] mb-4">
            <Lock size={24} />
          </div>
          <h2 className="text-2xl font-bold text-[#00FF00] tracking-wide">ADMIN ACCESS</h2>
          <p className="text-gray-500 text-sm mt-2">Enter your security credentials</p>
        </div>

        <div className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => { setError(''); setPassword(e.target.value); }}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="Enter Password"
              className="w-full bg-[#1a1a1a] border border-[#333] text-white px-4 py-3 rounded-xl focus:border-[#00FF00] focus:ring-1 focus:ring-[#00FF00] outline-none transition-all"
            />
            {error && (
              <div className="flex items-center gap-2 text-red-500 text-xs mt-2 ml-1">
                <AlertCircle size={12} />
                <span>{error}</span>
              </div>
            )}
          </div>

          <button
            onClick={handleLogin}
            className="w-full bg-[#00FF00] hover:bg-[#00cc00] text-black font-bold py-3 rounded-xl transition-all active:scale-95 shadow-[0_0_15px_rgba(0,255,0,0.2)]"
          >
            LOGIN
          </button>

          <div 
            onClick={onBack}
            className="flex items-center justify-center gap-2 text-gray-500 hover:text-white text-sm cursor-pointer mt-4 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Return to Chat</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;