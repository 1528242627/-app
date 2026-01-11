import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, ArrowUp, ArrowDown, Save, Check, X } from 'lucide-react';
import { ApiConfig, AiProvider } from '../types';
import { getApiConfigs, saveApiConfigs } from '../services/storage';

interface SettingsProps {
  onBack: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onBack }) => {
  const [configs, setConfigs] = useState<ApiConfig[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  
  // Form State
  const [newProvider, setNewProvider] = useState<AiProvider>('GOOGLE');
  const [newModel, setNewModel] = useState('gemini-3-flash-preview');
  const [newApiKey, setNewApiKey] = useState('');
  const [newBaseUrl, setNewBaseUrl] = useState('');

  useEffect(() => {
    setConfigs(getApiConfigs());
  }, []);

  const handleSaveConfigs = (newConfigs: ApiConfig[]) => {
    setConfigs(newConfigs);
    saveApiConfigs(newConfigs);
  };

  const addConfig = () => {
    if (!newApiKey || !newModel) {
        alert("API Key 和模型名称为必填项");
        return;
    }

    const config: ApiConfig = {
      id: Date.now().toString(),
      provider: newProvider,
      model: newModel,
      apiKey: newApiKey,
      baseUrl: newProvider === 'OPENAI' ? newBaseUrl : undefined,
      isEnabled: true,
    };

    handleSaveConfigs([...configs, config]);
    setIsAdding(false);
    resetForm();
  };

  const resetForm = () => {
      setNewProvider('GOOGLE');
      setNewModel('gemini-3-flash-preview');
      setNewApiKey('');
      setNewBaseUrl('');
  };

  const removeConfig = (id: string) => {
    handleSaveConfigs(configs.filter(c => c.id !== id));
  };

  const moveConfig = (index: number, direction: 'up' | 'down') => {
    const newConfigs = [...configs];
    if (direction === 'up' && index > 0) {
      [newConfigs[index], newConfigs[index - 1]] = [newConfigs[index - 1], newConfigs[index]];
    } else if (direction === 'down' && index < newConfigs.length - 1) {
      [newConfigs[index], newConfigs[index + 1]] = [newConfigs[index + 1], newConfigs[index]];
    }
    handleSaveConfigs(newConfigs);
  };

  const toggleConfig = (id: string) => {
    handleSaveConfigs(configs.map(c => c.id === id ? { ...c, isEnabled: !c.isEnabled } : c));
  };

  return (
    <div className="flex flex-col h-full bg-zen-bg animate-fade-in">
      <header className="flex items-center justify-between p-4 sticky top-0 bg-zen-bg/95 backdrop-blur-sm z-10 border-b border-gray-100">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 text-zen-text" title="返回">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-serif font-bold text-zen-text">
          设置
        </h1>
        <div className="w-10"></div> {/* Spacer for alignment */}
      </header>

      <main className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full">
        
        <div className="mb-8">
            <h2 className="text-xl font-serif font-bold mb-2 text-zen-text">AI 模型配置</h2>
            <p className="text-sm text-zen-muted mb-4">
                配置多个模型以实现备用。系统将按照列表顺序优先调用开启的模型。
                支持 Google Gemini 和所有兼容 OpenAI 格式的接口（如 DeepSeek, Moonshot 等）。
            </p>

            {configs.length === 0 && !isAdding && (
                <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg text-sm border border-yellow-100 mb-4">
                    当前未配置任何 API，系统将尝试使用默认的体验环境。建议配置您自己的 API Key 以获得稳定服务。
                </div>
            )}

            <div className="space-y-3">
                {configs.map((config, index) => (
                    <div key={config.id} className={`bg-white p-4 rounded-xl border transition-all ${config.isEnabled ? 'border-gray-200 shadow-sm' : 'border-gray-100 opacity-60'}`}>
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${config.provider === 'GOOGLE' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                    {config.provider}
                                </span>
                                <h3 className="font-medium text-zen-text">{config.model}</h3>
                            </div>
                            <div className="flex items-center space-x-1">
                                <button onClick={() => moveConfig(index, 'up')} disabled={index === 0} className="p-1 text-gray-400 hover:text-zen-accent disabled:opacity-30"><ArrowUp size={16}/></button>
                                <button onClick={() => moveConfig(index, 'down')} disabled={index === configs.length - 1} className="p-1 text-gray-400 hover:text-zen-accent disabled:opacity-30"><ArrowDown size={16}/></button>
                                <button onClick={() => removeConfig(config.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={16}/></button>
                            </div>
                        </div>
                        <div className="text-xs text-gray-500 break-all font-mono mb-2">
                            {config.provider === 'OPENAI' && config.baseUrl && <span className="mr-2">[{config.baseUrl}]</span>}
                            Key: {config.apiKey.substring(0, 6)}...******
                        </div>
                        <div className="flex items-center">
                            <label className="flex items-center text-sm text-gray-600 cursor-pointer select-none">
                                <input 
                                    type="checkbox" 
                                    checked={config.isEnabled} 
                                    onChange={() => toggleConfig(config.id)}
                                    className="mr-2 w-4 h-4 rounded text-zen-accent focus:ring-zen-accent" 
                                />
                                启用此配置
                            </label>
                        </div>
                    </div>
                ))}
            </div>

            {!isAdding ? (
                <button 
                    onClick={() => setIsAdding(true)}
                    className="mt-4 w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 font-medium hover:border-zen-accent hover:text-zen-accent transition-colors flex items-center justify-center gap-2"
                >
                    <Plus size={20} /> 添加模型配置
                </button>
            ) : (
                <div className="mt-4 bg-white p-5 rounded-xl shadow-md border border-indigo-50 animate-slide-up">
                    <h3 className="font-bold text-gray-800 mb-4">添加新配置</h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">接口类型</label>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => { setNewProvider('GOOGLE'); setNewModel('gemini-3-flash-preview'); }}
                                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${newProvider === 'GOOGLE' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                >
                                    Google Gemini
                                </button>
                                <button 
                                    onClick={() => { setNewProvider('OPENAI'); setNewModel('gpt-4o-mini'); }}
                                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${newProvider === 'OPENAI' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                >
                                    OpenAI 兼容
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">模型名称 (Model Name)</label>
                            <input 
                                type="text" 
                                value={newModel}
                                onChange={(e) => setNewModel(e.target.value)}
                                placeholder={newProvider === 'GOOGLE' ? "例如: gemini-3-flash-preview" : "例如: gpt-3.5-turbo, deepseek-chat"}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                            />
                        </div>

                        {newProvider === 'OPENAI' && (
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Base URL (选填)</label>
                                <input 
                                    type="text" 
                                    value={newBaseUrl}
                                    onChange={(e) => setNewBaseUrl(e.target.value)}
                                    placeholder="默认: https://api.openai.com/v1"
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                />
                                <p className="text-[10px] text-gray-400 mt-1">
                                    如果您使用 DeepSeek, Moonshot 等，请填写其 API 地址。
                                </p>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">API Key</label>
                            <input 
                                type="password" 
                                value={newApiKey}
                                onChange={(e) => setNewApiKey(e.target.value)}
                                placeholder="sk-..."
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono"
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button 
                                onClick={() => setIsAdding(false)}
                                className="flex-1 py-2 rounded-lg text-gray-600 font-medium hover:bg-gray-100 transition-colors"
                            >
                                取消
                            </button>
                            <button 
                                onClick={addConfig}
                                className="flex-1 py-2 rounded-lg bg-zen-text text-white font-medium hover:bg-black transition-colors flex items-center justify-center gap-2"
                            >
                                <Save size={16} /> 保存
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </main>
    </div>
  );
};

export default Settings;
