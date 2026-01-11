import React, { useState, useEffect, useCallback, useRef } from 'react';
import { format } from 'date-fns';
import { ArrowLeft, Mic, MicOff, Sparkles, Save, BrainCircuit, User, BookOpen } from 'lucide-react';
import { DiaryEntry, Persona } from '../types';
import { saveEntry, getEntryByDate, getRecentEntries } from '../services/storage';
import { generateInsight } from '../services/geminiService';

interface EditorProps {
  date: Date;
  onBack: () => void;
}

const PERSONA_LABELS: Record<Persona, string> = {
    [Persona.MENTOR]: '导师',
    [Persona.FRIEND]: '朋友',
    [Persona.PHILOSOPHER]: '哲学家',
};

const Editor: React.FC<EditorProps> = ({ date, onBack }) => {
  const dateStr = format(date, 'yyyy-MM-dd');
  const [content, setContent] = useState('');
  const [insight, setInsight] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<Persona>(Persona.FRIEND);
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const existing = getEntryByDate(dateStr);
    if (existing) {
      setContent(existing.content);
      setInsight(existing.aiInsight || '');
    }
  }, [dateStr]);

  const handleSave = useCallback(() => {
    const entry: DiaryEntry = {
      id: dateStr,
      date: dateStr,
      content,
      aiInsight: insight,
      updatedAt: Date.now(),
    };
    saveEntry(entry);
  }, [content, dateStr, insight]);

  // Autosave when unmounting or content changes
  useEffect(() => {
    const timer = setTimeout(handleSave, 1000);
    return () => clearTimeout(timer);
  }, [content, handleSave]);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("您的浏览器不支持语音识别。");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    // Set language to Mandarin Chinese (Simplified)
    recognition.lang = 'zh-CN';

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      
      // Append to current content (simple implementation)
      if (finalTranscript) {
         setContent(prev => prev + ' ' + finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error(event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
        setIsRecording(false);
    }

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  const handleGenerateInsight = async () => {
    if (!content.trim()) return;
    
    setIsGenerating(true);
    handleSave(); // Save current state first

    try {
      // Fetch context: previous 7 days
      const history = getRecentEntries(dateStr, 7);
      const result = await generateInsight(content, history, selectedPersona);
      setInsight(result);
      
      // Save the new insight
      const entry: DiaryEntry = {
        id: dateStr,
        date: dateStr,
        content,
        aiInsight: result,
        updatedAt: Date.now(),
      };
      saveEntry(entry);
    } catch (error) {
      alert("生成洞察失败，请重试。");
    } finally {
      setIsGenerating(false);
    }
  };

  const getPersonaIcon = (p: Persona) => {
    switch (p) {
        case Persona.MENTOR: return <BookOpen size={16} />;
        case Persona.FRIEND: return <User size={16} />;
        case Persona.PHILOSOPHER: return <BrainCircuit size={16} />;
    }
  };

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto bg-zen-bg animate-fade-in relative">
      <header className="flex items-center justify-between p-4 sticky top-0 bg-zen-bg/95 backdrop-blur-sm z-10 border-b border-gray-100">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 text-zen-text" title="返回">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-serif font-bold text-zen-text">
          {format(date, 'yyyy年 MM月 do')}
        </h1>
        <button onClick={handleSave} className="p-2 rounded-full hover:bg-gray-100 text-zen-accent" title="保存">
          <Save size={24} />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="今天有什么感悟？"
          className="w-full h-[50vh] bg-transparent resize-none border-none outline-none text-lg leading-relaxed text-zen-text font-serif placeholder-zen-muted"
        />

        {insight && (
          <div className="mt-8 p-6 bg-white rounded-2xl shadow-sm border border-indigo-50 animate-slide-up">
            <div className="flex items-center gap-2 mb-3 text-indigo-600">
              <Sparkles size={18} />
              <span className="text-xs font-bold uppercase tracking-wider">SoulLog 洞察 • {PERSONA_LABELS[selectedPersona]}</span>
            </div>
            <p className="text-gray-700 leading-relaxed font-sans text-sm md:text-base whitespace-pre-wrap">
              {insight}
            </p>
          </div>
        )}
      </main>

      {/* Floating Action Bar */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-white px-4 py-2 rounded-full shadow-lg border border-gray-100">
        <button
          onClick={toggleRecording}
          className={`p-3 rounded-full transition-all duration-300 ${isRecording ? 'bg-red-50 text-red-500 animate-pulse' : 'hover:bg-gray-50 text-zen-text'}`}
          title="语音转文字"
        >
          {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        <div className="h-6 w-px bg-gray-200"></div>

        <div className="relative">
            <button 
                onClick={() => setShowPersonaMenu(!showPersonaMenu)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium text-zen-text transition-colors"
                title="选择AI角色"
            >
                {getPersonaIcon(selectedPersona)}
                <span className="hidden sm:inline">{PERSONA_LABELS[selectedPersona]}</span>
            </button>
            
            {showPersonaMenu && (
                <div className="absolute bottom-full mb-2 left-0 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden w-40 flex flex-col">
                    {Object.values(Persona).map(p => (
                        <button
                            key={p}
                            onClick={() => { setSelectedPersona(p); setShowPersonaMenu(false); }}
                            className={`px-4 py-3 text-left text-xs font-medium hover:bg-indigo-50 transition-colors ${selectedPersona === p ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600'}`}
                        >
                            {PERSONA_LABELS[p]}
                        </button>
                    ))}
                </div>
            )}
        </div>

        <button
          onClick={handleGenerateInsight}
          disabled={isGenerating || !content}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all
            ${isGenerating 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5'}
          `}
        >
          {isGenerating ? (
             <span className="flex items-center gap-2">思考中...</span>
          ) : (
             <>
               <Sparkles size={16} />
               <span>生成洞察</span>
             </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Editor;