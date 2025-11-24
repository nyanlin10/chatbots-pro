
import React, { useState, useRef } from 'react';
import { AppData, KBItem } from '../types';
import { Book, Zap, Terminal, Share2, LogOut, Trash2, Plus, Eye, Settings, Key, ShieldCheck, AlertTriangle, Cpu, Server, User, Upload, X, FileText, Link as LinkIcon, File } from 'lucide-react';

interface AdminPanelProps {
  data: AppData;
  onUpdate: (newData: AppData | ((prev: AppData) => AppData)) => void;
  onLogout: () => void;
  onViewChat: () => void;
}

type Tab = 'kb' | 'quick' | 'prompt' | 'share' | 'api' | 'profile';
type KBType = 'text' | 'file' | 'url';

const AdminPanel: React.FC<AdminPanelProps> = ({ data, onUpdate, onLogout, onViewChat }) => {
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const kbFileInputRef = useRef<HTMLInputElement>(null);
  
  // KB State
  const [kbType, setKbType] = useState<KBType>('text');
  const [kbKey, setKbKey] = useState(''); // Text: Keyword, URL: Description
  const [kbAns, setKbAns] = useState(''); // Text: Answer, URL: URL
  const [kbFileProcessing, setKbFileProcessing] = useState(false);

  // Quick Reply State
  const [quickInput, setQuickInput] = useState('');

  // Prompt State
  const [promptInput, setPromptInput] = useState(data.systemPrompt);

  // Profile State
  const [nameInput, setNameInput] = useState(data.botName);

  // API Key State
  const [geminiInput, setGeminiInput] = useState('');
  const [openAiInput, setOpenAiInput] = useState('');

  // Custom API State
  const [customKeyInput, setCustomKeyInput] = useState('');
  const [customUrlInput, setCustomUrlInput] = useState(data.customBaseUrl);
  const [customModelInput, setCustomModelInput] = useState(data.customModel);
  const [showCustomKey, setShowCustomKey] = useState(false);

  // --- KB HANDLERS ---
  const handleAddKB = () => {
    if (!kbKey.trim() || !kbAns.trim()) return;
    
    const newItem: KBItem = {
      id: Date.now(),
      type: kbType,
      key: kbKey.trim(),
      answer: kbAns.trim()
    };

    onUpdate({ ...data, kb: [...data.kb, newItem] });
    setKbKey('');
    setKbAns('');
  };

  const handleKBFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Size check (max 50KB for text to be safe in localStorage)
    if (file.size > 50 * 1024) {
      alert("File too large! Max 50KB for local storage safety.");
      return;
    }

    setKbFileProcessing(true);
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const newItem: KBItem = {
        id: Date.now(),
        type: 'file',
        key: file.name,
        answer: content // Storing content directly
      };
      
      onUpdate({ ...data, kb: [...data.kb, newItem] });
      setKbFileProcessing(false);
      if (kbFileInputRef.current) kbFileInputRef.current.value = '';
    };

    reader.onerror = () => {
      alert("Error reading file.");
      setKbFileProcessing(false);
    };

    reader.readAsText(file);
  };

  const handleDeleteKB = (id: number) => {
    onUpdate({ ...data, kb: data.kb.filter(item => item.id !== id) });
  };

  // --- OTHER HANDLERS ---
  const handleAddQuick = () => {
    if (!quickInput.trim()) return;
    onUpdate({ ...data, quickReplies: [...data.quickReplies, quickInput.trim()] });
    setQuickInput('');
  };

  const handleDeleteQuick = (idx: number) => {
    const newQuick = [...data.quickReplies];
    newQuick.splice(idx, 1);
    onUpdate({ ...data, quickReplies: newQuick });
  };

  const handleSavePrompt = () => {
    onUpdate({ ...data, systemPrompt: promptInput });
    alert("System prompt updated!");
  };

  const handleSaveProfile = () => {
    onUpdate({ ...data, botName: nameInput });
    alert("Bot Profile updated!");
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024) {
        alert("Image is too large! Please upload an image smaller than 500KB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdate({ ...data, botAvatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    onUpdate({ ...data, botAvatar: '' });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- API KEY HANDLERS (MULTI-KEY SYSTEM) ---
  
  const handleAddGeminiKey = () => {
    if(!geminiInput.trim()) return;
    onUpdate({ ...data, geminiKeys: [...(data.geminiKeys || []), geminiInput.trim()] });
    setGeminiInput('');
  };

  const removeGeminiKey = (index: number) => {
    const newKeys = [...data.geminiKeys];
    newKeys.splice(index, 1);
    onUpdate({ ...data, geminiKeys: newKeys });
  };

  const handleAddOpenAiKey = () => {
    if(!openAiInput.trim()) return;
    onUpdate({ ...data, openAiKeys: [...(data.openAiKeys || []), openAiInput.trim()] });
    setOpenAiInput('');
  };

  const removeOpenAiKey = (index: number) => {
    const newKeys = [...data.openAiKeys];
    newKeys.splice(index, 1);
    onUpdate({ ...data, openAiKeys: newKeys });
  };

  const handleSaveCustom = () => {
    onUpdate({
      ...data,
      customApiKey: customKeyInput.trim() ? customKeyInput.trim() : data.customApiKey,
      customBaseUrl: customUrlInput.trim(),
      customModel: customModelInput.trim()
    });
    setCustomKeyInput('');
    alert("Custom Provider Settings Saved!");
  };
  
  const handleDeleteCustom = () => {
    if (confirm("Remove Custom API Key?")) {
      onUpdate({ ...data, customApiKey: '' });
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Link copied to clipboard!");
  };

  const maskKey = (key: string) => {
    if (key.length <= 8) return '********';
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
  };

  return (
    <div className="flex flex-col h-full bg-black text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-[#111] border-b border-[#333]">
        <div className="flex items-center gap-3 text-[#00FF00]">
          <Settings className="w-6 h-6" />
          <h1 className="text-xl font-bold tracking-wider">ADMIN PANEL</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={onViewChat} className="p-2 text-gray-400 hover:text-white transition-colors" title="View Chat">
            <Eye size={20} />
          </button>
          <button onClick={onLogout} className="p-2 text-red-500 hover:text-red-400 transition-colors" title="Logout">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        {/* Sidebar */}
        <aside className="w-full md:w-64 bg-[#050505] border-r border-[#333] p-4 flex md:flex-col gap-2 overflow-x-auto md:overflow-visible flex-shrink-0">
          <TabButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<User size={18} />} label="Bot Profile" />
          <TabButton active={activeTab === 'kb'} onClick={() => setActiveTab('kb')} icon={<Book size={18} />} label="Knowledge Base" />
          <TabButton active={activeTab === 'quick'} onClick={() => setActiveTab('quick')} icon={<Zap size={18} />} label="Quick Replies" />
          <TabButton active={activeTab === 'prompt'} onClick={() => setActiveTab('prompt')} icon={<Terminal size={18} />} label="System Prompt" />
          <TabButton active={activeTab === 'api'} onClick={() => setActiveTab('api')} icon={<Key size={18} />} label="API Configuration" />
          <TabButton active={activeTab === 'share'} onClick={() => setActiveTab('share')} icon={<Share2 size={18} />} label="Share" />
        </aside>

        {/* Content */}
        <main className="flex-1 p-6 overflow-y-auto bg-black">
          
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="max-w-4xl mx-auto space-y-8 animate-pop-in">
               <h2 className="text-2xl font-bold text-[#00FF00] border-b border-[#333] pb-2">Bot Identity</h2>
               <div className="grid md:grid-cols-3 gap-8">
                 <div className="bg-[#111] p-6 rounded-xl border border-[#333] flex flex-col items-center gap-4">
                    <div className="relative group">
                      <div className="w-32 h-32 rounded-full bg-[#222] flex items-center justify-center border-2 border-[#333] overflow-hidden">
                        {data.botAvatar ? (
                          <img src={data.botAvatar} alt="Bot Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <User size={48} className="text-gray-500" />
                        )}
                      </div>
                      {data.botAvatar && (
                        <button 
                          onClick={handleRemoveAvatar}
                          className="absolute top-0 right-0 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    <div className="text-center w-full">
                      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleAvatarUpload} className="hidden" id="avatar-upload" />
                      <label htmlFor="avatar-upload" className="inline-flex items-center gap-2 bg-[#222] hover:bg-[#333] text-white px-4 py-2 rounded-lg cursor-pointer transition-colors text-sm font-medium">
                        <Upload size={16} /> Upload Photo
                      </label>
                      <p className="text-xs text-gray-500 mt-2">Max size 500KB</p>
                    </div>
                 </div>
                 <div className="md:col-span-2 space-y-6">
                    <div className="bg-[#111] p-6 rounded-xl border border-[#333]">
                      <label className="block text-gray-400 text-sm font-bold mb-2 uppercase">Bot Name</label>
                      <input 
                        type="text" 
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        className="w-full bg-[#1a1a1a] border border-[#333] text-white p-3 rounded-lg focus:border-[#00FF00] outline-none text-lg"
                      />
                    </div>
                    <button onClick={handleSaveProfile} className="w-full bg-[#00FF00] hover:bg-[#00cc00] text-black font-bold py-3 rounded-lg transition-transform active:scale-95">Save Profile</button>
                 </div>
               </div>
            </div>
          )}

          {/* Knowledge Base Tab */}
          {activeTab === 'kb' && (
            <div className="max-w-4xl mx-auto space-y-6 animate-pop-in">
              <h2 className="text-2xl font-bold text-[#00FF00] border-b border-[#333] pb-2">Knowledge Base</h2>
              
              <div className="bg-[#111] p-5 rounded-xl border border-[#333] space-y-4">
                {/* Type Selectors */}
                <div className="flex gap-2 border-b border-[#333] pb-4">
                   <button onClick={() => setKbType('text')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${kbType === 'text' ? 'bg-[#00FF00] text-black' : 'bg-[#222] text-gray-400 hover:bg-[#333]'}`}>
                      <FileText size={16} /> Text Rule
                   </button>
                   <button onClick={() => setKbType('file')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${kbType === 'file' ? 'bg-[#00FF00] text-black' : 'bg-[#222] text-gray-400 hover:bg-[#333]'}`}>
                      <File size={16} /> Upload File
                   </button>
                   <button onClick={() => setKbType('url')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${kbType === 'url' ? 'bg-[#00FF00] text-black' : 'bg-[#222] text-gray-400 hover:bg-[#333]'}`}>
                      <LinkIcon size={16} /> Add Link
                   </button>
                </div>

                {/* Input Forms */}
                <div className="grid gap-4">
                  {kbType === 'text' && (
                    <>
                      <input className="bg-[#1a1a1a] border border-[#333] text-white p-3 rounded-lg focus:border-[#00FF00] outline-none" placeholder="Keyword (e.g., price)" value={kbKey} onChange={(e) => setKbKey(e.target.value)} />
                      <textarea className="bg-[#1a1a1a] border border-[#333] text-white p-3 rounded-lg focus:border-[#00FF00] outline-none resize-none" rows={3} placeholder="Bot Answer" value={kbAns} onChange={(e) => setKbAns(e.target.value)} />
                      <button onClick={handleAddKB} className="bg-[#00FF00] hover:bg-[#00cc00] text-black font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-transform active:scale-95">
                        <Plus size={18} /> Add Text Rule
                      </button>
                    </>
                  )}

                  {kbType === 'url' && (
                    <>
                      <input className="bg-[#1a1a1a] border border-[#333] text-white p-3 rounded-lg focus:border-[#00FF00] outline-none" placeholder="Description (e.g., Facebook Page, Official Website)" value={kbKey} onChange={(e) => setKbKey(e.target.value)} />
                      <input className="bg-[#1a1a1a] border border-[#333] text-white p-3 rounded-lg focus:border-[#00FF00] outline-none" placeholder="https://..." value={kbAns} onChange={(e) => setKbAns(e.target.value)} />
                      <button onClick={handleAddKB} className="bg-[#00FF00] hover:bg-[#00cc00] text-black font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-transform active:scale-95">
                        <Plus size={18} /> Add Link
                      </button>
                    </>
                  )}

                  {kbType === 'file' && (
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-[#333] rounded-lg p-8 hover:border-[#00FF00] transition-colors bg-[#050505]">
                      <input type="file" id="kb-file" className="hidden" accept=".txt,.md,.json,.csv" ref={kbFileInputRef} onChange={handleKBFileUpload} />
                      <label htmlFor="kb-file" className="flex flex-col items-center cursor-pointer">
                        <Upload size={32} className="text-[#00FF00] mb-2" />
                        <span className="text-gray-300 font-medium">Click to upload Text File</span>
                        <span className="text-gray-500 text-xs mt-1">.txt, .md, .json (Max 50KB)</span>
                      </label>
                      {kbFileProcessing && <p className="text-[#00FF00] mt-2 animate-pulse">Processing file...</p>}
                    </div>
                  )}
                </div>
              </div>

              {/* Data List */}
              <div className="space-y-3">
                {data.kb.map((item) => (
                  <div key={item.id} className="bg-[#111] p-4 rounded-lg border border-[#333] flex justify-between items-start group hover:border-[#444] transition-colors">
                    <div className="flex gap-3">
                      <div className="mt-1 text-[#00FF00]">
                        {item.type === 'text' && <FileText size={18} />}
                        {item.type === 'file' && <File size={18} />}
                        {item.type === 'url' && <LinkIcon size={18} />}
                      </div>
                      <div>
                        <span className="inline-block bg-[#222] text-[#00FF00] text-xs px-2 py-1 rounded mb-2 font-mono uppercase">
                          {item.type === 'url' ? 'LINK' : item.type === 'file' ? 'DOC' : 'RULE'}
                        </span>
                        <h4 className="font-bold text-gray-200 text-sm mb-1">{item.key}</h4>
                        <p className="text-gray-500 text-xs line-clamp-2 font-mono">
                          {item.answer}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteKB(item.id)} className="text-gray-600 hover:text-red-500 transition-colors p-1">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {data.kb.length === 0 && <p className="text-gray-600 text-center py-8">No knowledge items yet.</p>}
              </div>
            </div>
          )}

          {/* Quick Replies Tab */}
          {activeTab === 'quick' && (
            <div className="max-w-4xl mx-auto space-y-6 animate-pop-in">
              <h2 className="text-2xl font-bold text-[#00FF00] border-b border-[#333] pb-2">Quick Questions</h2>
              <div className="flex gap-3">
                <input className="flex-1 bg-[#1a1a1a] border border-[#333] text-white p-3 rounded-lg focus:border-[#00FF00] outline-none" placeholder="New Quick Question" value={quickInput} onChange={(e) => setQuickInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddQuick()} />
                <button onClick={handleAddQuick} className="bg-[#00FF00] hover:bg-[#00cc00] text-black font-bold px-6 rounded-lg transition-transform active:scale-95">Add</button>
              </div>
              <div className="space-y-2">
                {data.quickReplies.map((q, idx) => (
                  <div key={idx} className="bg-[#111] p-4 rounded-lg border border-[#333] flex justify-between items-center">
                    <span className="text-gray-300">{q}</span>
                    <button onClick={() => handleDeleteQuick(idx)} className="text-gray-600 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prompt Tab */}
          {activeTab === 'prompt' && (
            <div className="max-w-4xl mx-auto space-y-6 animate-pop-in">
              <h2 className="text-2xl font-bold text-[#00FF00] border-b border-[#333] pb-2">System Prompt</h2>
              <textarea className="w-full bg-[#1a1a1a] border border-[#333] text-white p-4 rounded-xl focus:border-[#00FF00] outline-none h-64 resize-none font-mono text-sm leading-relaxed" value={promptInput} onChange={(e) => setPromptInput(e.target.value)} />
              <button onClick={handleSavePrompt} className="bg-[#00FF00] hover:bg-[#00cc00] text-black font-bold py-3 px-8 rounded-lg transition-transform active:scale-95">Save Prompt Configuration</button>
            </div>
          )}

          {/* API Configuration Tab */}
          {activeTab === 'api' && (
             <div className="max-w-4xl mx-auto space-y-8 animate-pop-in pb-12">
              <h2 className="text-2xl font-bold text-[#00FF00] border-b border-[#333] pb-2">AI Configuration</h2>
              <p className="text-gray-400 text-sm">Add multiple API keys to enable automatic failover. If one key reaches its limit, the system will try the next one.</p>
              
              {/* Gemini Section */}
              <div className="bg-[#111] p-6 rounded-xl border border-[#333] shadow-lg relative overflow-hidden group">
                <div className="flex items-start gap-4 mb-4 relative z-10">
                  <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400"><ShieldCheck size={24} /></div>
                  <div>
                    <h3 className="text-lg font-bold text-white">1. Google Gemini (Priority)</h3>
                    <p className="text-xs text-gray-500">Service: gemini-2.5-flash</p>
                  </div>
                </div>
                
                {/* Key List */}
                <div className="space-y-2 mb-4">
                  {data.geminiKeys && data.geminiKeys.map((key, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-[#050505] border border-[#333] p-2 rounded-lg text-sm">
                      <span className="text-gray-300 font-mono flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        {maskKey(key)}
                      </span>
                      <button onClick={() => removeGeminiKey(idx)} className="text-red-500 hover:text-red-400 p-1"><Trash2 size={14} /></button>
                    </div>
                  ))}
                  {(!data.geminiKeys || data.geminiKeys.length === 0) && (
                     <p className="text-gray-600 text-xs italic">No Gemini keys added. System might use environment variables if available.</p>
                  )}
                </div>

                <div className="flex gap-2 relative z-10">
                  <input type="text" value={geminiInput} onChange={(e) => setGeminiInput(e.target.value)} placeholder="Add new Gemini Key" className="flex-1 bg-[#1a1a1a] border border-[#333] text-white p-3 rounded-lg focus:border-blue-500 outline-none text-sm" />
                  <button onClick={handleAddGeminiKey} disabled={!geminiInput} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold px-4 rounded-lg text-sm">Add Key</button>
                </div>
              </div>

              {/* OpenAI Section */}
              <div className="bg-[#111] p-6 rounded-xl border border-[#333] shadow-lg relative overflow-hidden group">
                 <div className="flex items-start gap-4 mb-4 relative z-10">
                  <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400"><Cpu size={24} /></div>
                  <div>
                    <h3 className="text-lg font-bold text-white">2. OpenAI (Fallback)</h3>
                    <p className="text-xs text-gray-500">Service: gpt-3.5-turbo</p>
                  </div>
                </div>

                 {/* Key List */}
                <div className="space-y-2 mb-4">
                  {data.openAiKeys && data.openAiKeys.map((key, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-[#050505] border border-[#333] p-2 rounded-lg text-sm">
                      <span className="text-gray-300 font-mono flex items-center gap-2">
                        <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                        {maskKey(key)}
                      </span>
                      <button onClick={() => removeOpenAiKey(idx)} className="text-red-500 hover:text-red-400 p-1"><Trash2 size={14} /></button>
                    </div>
                  ))}
                   {(!data.openAiKeys || data.openAiKeys.length === 0) && (
                     <p className="text-gray-600 text-xs italic">No OpenAI keys added.</p>
                  )}
                </div>

                <div className="flex gap-2 relative z-10">
                  <input type="text" value={openAiInput} onChange={(e) => setOpenAiInput(e.target.value)} placeholder="Add new OpenAI Key" className="flex-1 bg-[#1a1a1a] border border-[#333] text-white p-3 rounded-lg focus:border-purple-500 outline-none text-sm" />
                  <button onClick={handleAddOpenAiKey} disabled={!openAiInput} className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold px-4 rounded-lg text-sm">Add Key</button>
                </div>
              </div>

               {/* Custom API Section */}
              <div className="bg-[#111] p-6 rounded-xl border border-[#333] shadow-lg relative overflow-hidden group">
                 <div className="flex items-start gap-4 mb-6 relative z-10">
                  <div className="p-3 bg-orange-500/10 rounded-lg text-orange-400"><Server size={24} /></div>
                  <div><h3 className="text-lg font-bold text-white">3. Custom Provider (DeepSeek / Groq)</h3></div>
                </div>
                <div className="space-y-4 relative z-10">
                   <div className="grid grid-cols-2 gap-4">
                       <input value={customUrlInput} onChange={(e) => setCustomUrlInput(e.target.value)} placeholder="Base URL (e.g. https://api.deepseek.com/v1)" className="col-span-2 bg-[#050505] border border-[#333] text-white p-3 rounded-lg focus:border-orange-500 outline-none text-sm" />
                       <input value={customModelInput} onChange={(e) => setCustomModelInput(e.target.value)} placeholder="Model Name (e.g. deepseek-chat)" className="bg-[#050505] border border-[#333] text-white p-3 rounded-lg focus:border-orange-500 outline-none text-sm" />
                       <div className="flex gap-2">
                         <input type={showCustomKey ? "text" : "password"} value={customKeyInput} onChange={(e) => setCustomKeyInput(e.target.value)} placeholder={data.customApiKey ? "Key Saved (Type to update)" : "Paste API Key"} className="flex-1 bg-[#050505] border border-[#333] text-white p-3 rounded-lg focus:border-orange-500 outline-none text-sm" />
                         <button onClick={() => setShowCustomKey(!showCustomKey)} className="px-3 bg-[#222] hover:bg-[#333] rounded-lg text-gray-400">{showCustomKey ? <Eye size={16} /> : <div className="w-4 h-4 bg-gray-600 rounded-sm opacity-50"></div>}</button>
                       </div>
                   </div>
                   <div className="flex gap-2">
                    <button onClick={handleSaveCustom} className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-bold py-2 rounded-lg text-sm">Save Custom Settings</button>
                    {data.customApiKey && <button onClick={handleDeleteCustom} className="bg-[#222] text-red-500 hover:text-white px-4 rounded-lg"><Trash2 size={16} /></button>}
                   </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'share' && (
            <div className="max-w-4xl mx-auto space-y-6 animate-pop-in">
              <h2 className="text-2xl font-bold text-[#00FF00] border-b border-[#333] pb-2">Share Link</h2>
              <div className="bg-[#111] p-6 rounded-xl border border-[#333] text-center">
                <input readOnly value={window.location.href} className="w-full bg-[#000] border border-[#333] text-gray-300 p-3 rounded-lg outline-none mb-4 text-center" />
                <button onClick={copyShareLink} className="bg-[#333] hover:bg-[#444] text-white px-6 py-2 rounded-lg font-medium transition-colors">Copy Link</button>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

const TabButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${active ? 'bg-[#00FF00]/10 text-[#00FF00] font-medium' : 'text-gray-500 hover:bg-[#111] hover:text-gray-300'}`}>
    {icon} <span className="whitespace-nowrap">{label}</span>
  </button>
);

export default AdminPanel;
