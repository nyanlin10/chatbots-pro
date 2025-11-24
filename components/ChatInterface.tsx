import React, { useState, useEffect, useRef } from 'react';
import { AppData, Message, DEFAULT_DATA } from '../types';
import { generateAIResponse, isAIEnabled } from '../services/geminiService';
import { Send, Bot, Trash2, Shield, LogIn, Mic } from 'lucide-react';

interface ChatInterfaceProps {
  appData: AppData;
  onUpdateData: (data: AppData | ((prev: AppData) => AppData)) => void;
  onAdminRequest: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ appData, onUpdateData, onAdminRequest }) => {
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  
  // Use messages from AppData (Local Storage)
  const messages = appData.messages || DEFAULT_DATA.messages;
  
  // Bot Identity
  const botName = appData.botName || 'Service Pro';
  const botAvatar = appData.botAvatar;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    // Cleanup recognition on unmount
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleClearChat = () => {
    if (confirm("Clear chat history?")) {
      onUpdateData(prev => ({
        ...prev,
        messages: DEFAULT_DATA.messages
      }));
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = 'en-US'; // Could be dynamic based on user preference
    recognition.interimResults = false;
    
    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(prev => (prev ? prev + ' ' : '') + transcript);
    };
    
    recognition.onerror = (event: any) => {
        console.error("Speech Error:", event.error);
        setIsListening(false);
    };
    
    recognition.onend = () => {
        setIsListening(false);
    };

    recognition.start();
  };

  const handleSend = async (textOverride?: string) => {
    const text = textOverride || inputText;
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: text,
      sender: 'user',
      timestamp: Date.now()
    };

    // Update State safely using functional update
    onUpdateData(prev => ({
      ...prev,
      messages: [...prev.messages, userMsg]
    }));
    
    setInputText('');
    setIsTyping(true);

    // --- Bot Logic ---
    const lowerText = text.toLowerCase();
    
    // 1. Check Local Knowledge Base (Exact/Fuzzy keyword match) - STRICTLY TEXT RULES ONLY
    // We do not want to dump a whole file content if a keyword matches a file name in local mode.
    const kbMatch = appData.kb.find(item => 
      item.type === 'text' && lowerText.includes(item.key.toLowerCase())
    );
    
    if (kbMatch) {
      setTimeout(() => {
        addBotMessage(kbMatch.answer);
      }, 600);
      return;
    }

    // 2. Fallback to Gemini AI if API Key exists (Local or Env)
    if (isAIEnabled(appData)) {
      try {
        const aiResponse = await generateAIResponse(text, appData);
        addBotMessage(aiResponse);
      } catch (e) {
        addBotMessage("I'm having trouble connecting to my brain right now.");
      }
    } else {
      // 3. Final Fallback (No AI, No KB)
      setTimeout(() => {
        addBotMessage("I'm sorry, I don't have an answer for that. Please try asking about our 'price' or 'location'.");
      }, 800);
    }
  };

  const addBotMessage = (text: string) => {
    setIsTyping(false);
    onUpdateData(prev => ({
      ...prev,
      messages: [...prev.messages, {
        id: Date.now().toString(),
        text,
        sender: 'bot',
        timestamp: Date.now()
      }]
    }));
  };

  return (
    <div className="flex flex-col h-full bg-black relative">
      {/* Chat Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-[#111]/90 backdrop-blur border-b border-[#00FF00]/30 sticky top-0 z-10 shadow-[0_10px_40px_-10px_rgba(0,255,0,0.3)]">
        <div className="flex items-center gap-3">
          {botAvatar ? (
             <img src={botAvatar} alt="Bot" className="w-10 h-10 rounded-full object-cover border border-[#333]" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#00FF00] flex items-center justify-center text-black shadow-[0_0_10px_rgba(0,255,0,0.4)]">
              <Bot size={24} />
            </div>
          )}
          <div>
            <h1 className="font-bold text-white text-base">{botName}</h1>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#00FF00] animate-pulse"></span>
              <span className="text-[11px] text-[#00FF00] font-medium tracking-wide">ONLINE</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
           <button 
            onClick={handleClearChat}
            className="text-gray-600 hover:text-red-500 p-2 transition-colors"
            title="Clear History"
          >
            <Trash2 size={16} />
          </button>
          
          <button 
            onClick={onAdminRequest} 
            className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded transition-all ${
              appData.isAdminLoggedIn 
              ? 'bg-[#00FF00]/10 text-[#00FF00] border border-[#00FF00]/30 hover:bg-[#00FF00]/20' 
              : 'text-gray-500 hover:text-white border border-[#333] hover:border-gray-500'
            }`}
          >
            {appData.isAdminLoggedIn ? <Shield size={12} /> : <LogIn size={12} />}
            {appData.isAdminLoggedIn ? 'Admin Panel' : 'Admin Login'}
          </button>
        </div>
      </header>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex w-full gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {/* Bot Avatar (Displayed to the left of bot messages) */}
            {msg.sender === 'bot' && (
              <div className="flex-shrink-0 flex flex-col justify-end">
                {botAvatar ? (
                  <img src={botAvatar} className="w-8 h-8 rounded-full object-cover border border-[#333]" alt="Bot" />
                ) : (
                   <div className="w-8 h-8 rounded-full bg-[#00FF00]/20 flex items-center justify-center text-[#00FF00]">
                    <Bot size={16} />
                   </div>
                )}
              </div>
            )}

            <div 
              className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed animate-pop-in shadow-md ${
                msg.sender === 'user' 
                  ? 'bg-[#00FF00] text-black rounded-br-none font-semibold' 
                  : 'bg-[#1a1a1a] text-gray-100 rounded-bl-none border border-[#333]'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start items-center gap-2 animate-pop-in">
             <div className="flex-shrink-0 flex flex-col justify-end">
                {botAvatar ? (
                  <img src={botAvatar} className="w-8 h-8 rounded-full object-cover border border-[#333]" alt="Bot" />
                ) : (
                   <div className="w-8 h-8 rounded-full bg-[#00FF00]/20 flex items-center justify-center text-[#00FF00]">
                    <Bot size={16} />
                   </div>
                )}
              </div>
            <div className="bg-[#1a1a1a] border border-[#333] px-4 py-3 rounded-2xl rounded-bl-none flex gap-1 items-center">
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0.1s]"></span>
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Replies */}
      {appData.quickReplies.length > 0 && (
        <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar bg-gradient-to-t from-black to-transparent">
          {appData.quickReplies.map((qr, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(qr)}
              className="whitespace-nowrap bg-[#111] hover:bg-[#00FF00] hover:text-black text-[#00FF00] border border-[#333] hover:border-[#00FF00] px-4 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95"
            >
              {qr}
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 bg-black border-t border-[#333]">
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleListening}
            className={`p-3 rounded-full transition-all border border-transparent flex-shrink-0 ${
                isListening 
                ? 'bg-[#00FF00]/20 text-[#00FF00] border-[#00FF00]/50 animate-pulse' 
                : 'bg-[#1a1a1a] text-gray-400 hover:text-white border-[#333] hover:border-gray-500'
            }`}
            title="Voice Typing"
          >
            <Mic size={20} />
          </button>
          
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={isListening ? "Listening..." : "Type a message..."}
            className={`flex-1 bg-[#1a1a1a] text-white border border-[#333] rounded-full px-5 py-3 focus:outline-none focus:border-[#00FF00] focus:ring-1 focus:ring-[#00FF00] transition-all placeholder-gray-600 ${isListening ? 'border-[#00FF00]/50 placeholder-[#00FF00]/50' : ''}`}
          />
          <button 
            onClick={() => handleSend()}
            disabled={!inputText.trim()}
            className="w-12 h-12 rounded-full bg-[#00FF00] hover:bg-[#00cc00] disabled:bg-[#333] disabled:cursor-not-allowed flex items-center justify-center text-black transition-all active:scale-95 shadow-[0_0_10px_rgba(0,255,0,0.2)] disabled:shadow-none flex-shrink-0"
          >
            <Send size={20} className={inputText.trim() ? 'ml-0.5' : ''} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;