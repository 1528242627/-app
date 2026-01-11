import { GoogleGenAI } from "@google/genai";
import { Persona, DiaryEntry, ApiConfig } from '../types';
import { getApiConfigs } from './storage';

const PERSONA_PROMPTS: Record<Persona, string> = {
  [Persona.MENTOR]: "你是一位智慧且富有建设性的导师。分析用户最近的日记条目。关注个人成长，为未来提供切实的建议，并强调他们的优势。语气要充满鼓励，但在必要时也要坚定。",
  [Persona.FRIEND]: "你是一位亲密、善解人意的朋友。以温暖和理解的态度阅读用户的日记。肯定他们的感受，提供安慰，并像朋友一样随意交谈。不要太爱说教，只需陪伴在他们身边。",
  [Persona.PHILOSOPHER]: "你是一位深刻、抽象的哲学家。将用户日记中的事件与更广泛的存在主义概念、斯多葛学派或人性联系起来。鼓励深层反思。使用隐喻并提出反问句以引发思考。"
};

// 构造通用的 Prompt 内容
const buildPrompt = (currentEntry: string, recentEntries: DiaryEntry[], persona: Persona) => {
    const context = recentEntries.map(e => `日期: ${e.date}\n内容: ${e.content}`).join('\n---\n');
    return `
    以下是我过去一周直到今天的日记内容：
    
    ${context}
    
    今天的日记（草稿）:
    ${currentEntry}
    
    请根据这些想法，为我提供一段基于“${persona}”视角的深度洞察和反馈。
  `;
};

// 调用 Google Gemini SDK
const callGoogleGemini = async (config: ApiConfig | null, prompt: string, systemInstruction: string): Promise<string> => {
    const apiKey = config ? config.apiKey : process.env.API_KEY;
    const modelName = config ? config.model : 'gemini-3-flash-preview';

    if (!apiKey) throw new Error("No API Key available for Google Provider");

    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
            systemInstruction: systemInstruction,
            thinkingConfig: { thinkingBudget: 0 }
        },
    });

    return response.text || "";
};

// 调用 OpenAI 兼容接口 (Fetch)
const callOpenAICompatible = async (config: ApiConfig, prompt: string, systemInstruction: string): Promise<string> => {
    const baseUrl = config.baseUrl || "https://api.openai.com/v1";
    // 确保 url 结尾没有 /
    const cleanUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const url = `${cleanUrl}/chat/completions`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
            model: config.model,
            messages: [
                { role: "system", content: systemInstruction },
                { role: "user", content: prompt }
            ],
            temperature: 0.7
        })
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`OpenAI API Error: ${response.status} - ${err}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
};

export const generateInsight = async (
  currentEntry: string,
  recentEntries: DiaryEntry[],
  persona: Persona
): Promise<string> => {
  const configs = getApiConfigs().filter(c => c.isEnabled);
  const prompt = buildPrompt(currentEntry, recentEntries, persona);
  const systemInstruction = PERSONA_PROMPTS[persona];

  // 1. 如果没有自定义配置，尝试使用默认环境变量 (Backward Compatibility)
  if (configs.length === 0) {
      console.log("Using default environment configuration.");
      try {
          return await callGoogleGemini(null, prompt, systemInstruction);
      } catch (error) {
          console.error("Default Env API failed:", error);
          throw new Error("默认AI服务连接失败，请在设置中配置API Key。");
      }
  }

  // 2. 遍历配置列表，按顺序尝试 (Priority Logic)
  let lastError: Error | null = null;

  for (const config of configs) {
      try {
          console.log(`Trying config: ${config.model} (${config.provider})`);
          if (config.provider === 'GOOGLE') {
              return await callGoogleGemini(config, prompt, systemInstruction);
          } else {
              return await callOpenAICompatible(config, prompt, systemInstruction);
          }
      } catch (error) {
          console.warn(`Config ${config.model} failed:`, error);
          lastError = error as Error;
          // Continue to next config
      }
  }

  // 3. 如果所有都失败
  throw lastError || new Error("所有配置的AI服务均调用失败。");
};
