import { GoogleGenAI, Type } from "@google/genai";
import { MarketingCardData, GeneratedContentResponse, CardLayoutStyle } from "../types";

// Define different content strategies to ensure variety every time
const CONTENT_ANGLES = [
  {
    name: "The 'Reverse Psychology' Angle",
    instruction: "Use a 'Warning' or 'Regret' tone. E.g., 'Don't use this if you want to leave work late', 'I regret knowing this tool so late'. Break user defenses by sounding like a peer warning another peer."
  },
  {
    name: "The 'Workplace Story' Angle",
    instruction: "Start with a relatable workplace scenario (e.g., sudden deadline, picky client, finding mood references). Narrate a short 'Hero's Journey' where the tool saved the day. Tone: Authentic, slightly emotional, 'I feel you'."
  },
  {
    name: "The 'Dry Goods/Methodology' Angle",
    instruction: "Focus purely on 'How-To'. Title should be like '3 Steps to disassemble a viral video'. The product features should be presented as the 'Tools needed' for step 2 or 3. High information density."
  },
  {
    name: "The 'Visual/Aesthetic' Angle",
    instruction: "Focus on 'Inspiration' and 'Taste'. Share a specific aesthetic style (e.g., Wong Kar-wai style, Y2K). Position the tool as the 'Key' to finding these specific visuals instantly."
  }
];

const VIRAL_PRINCIPLES = `
**CRITICAL VIRAL CONTENT PRINCIPLES (Apply these strictly):**
1. **Authenticity Over Perfection:** Do NOT sound like a corporate robot or a press release. Sound like a real Creative Director or Ad Professional sharing a secret tip. Use casual language, slang (but professional), and express genuine emotion.
2. **Reverse Titles:** Use titles like "劝你别买" (Advising you not to buy), "千万别..." (Never...), or "后悔..." (Regret...). Spark curiosity.
3. **High Information Density:** The content must feel like "Dry Goods" (干货). Use lists, comparisons, or step-by-step guides.
4. **Social Currency:** Give users a reason to share. E.g., "Share this with your chaotic art director," "Tag your overtime buddy."
5. **Interaction Triggers:** End with a question or a challenge to boost comments.
6. **Soft Implant:** Do not start with the product. Start with the *Problem* or the *Insight*, then introduce Shining AI (闪灵AI) as the natural solution.
`;

const SYSTEM_INSTRUCTION = `
You are a senior creative strategist and top-tier Xiaohongshu (Red Note) content creator for "Shining AI" (闪灵AI).
Your goal is to produce "Hot/Viral" content that appeals to Advertising Professionals, Directors, and Video Creators.

**Product Core Features (Softly integrate these):**
1. Natural Language Video Search (Find frames by describing them).
2. Online Storyboard (Rapidly build narratives/PPTs).
3. AI Favorites (Semantic search for your inspiration library).

**Output Requirement:**
Return a JSON Object with "layoutStyle", "xiaohongshu", and "cards".

**1. "layoutStyle" (Unified Visual Theme):**
Analyze your generated content and strategy. Select ONE visual style that best fits the tone.
**CRITICAL:** You MUST vary your style choice. Do not default to 'minimal'. Be creative!
- **'minimal'**: Professional, tech-heavy, clean.
- **'handwritten'**: Best for personal stories, "secret notes", drafts, or checklists (even for 'Dry Goods' content, a handwritten checklist feels more authentic).
- **'comic'**: Best for dramatic "Reverse Psychology", fun complaints, or exaggerated scenarios.
- **'magazine'**: Best for aesthetic inspiration, visual trends, or high-end taste.

**2. "xiaohongshu" (The Viral Post):**
   - **Title:** MUST use the defined 'Angle' (e.g., Reverse Psychology). Max 20 chars. Emoji rich.
   - **Content:** 150-200 words. 
     - Structure: Hook -> Pain Point -> Dry Good/Solution (Shining AI) -> Social Trigger.
     - Tone: "Internet Native", Professional but fun.
   - **Tags:** **EXACTLY 5 TAGS**. Select the 5 most effective and targeted tags for the audience (e.g., #VideoProduction #MarketingTips). Do not include generic tags if possible.

**3. "cards" (4 Marketing Posters):**
   - **Card 1 (The Hook):** A strong statement or question related to the chosen Angle.
   - **Card 2 (The Value):** A specific tip, method, or insight (The "Dry Good").
   - **Card 3 (The Solution):** How Shining AI solves the specific problem mentioned in Card 2.
   - **Card 4 (The CTA/Promo):**
     - Title: "限时福利" or "内测邀请" (Keep it consistent).
     - Body: "1. 注册即送算值\n2. 体验网址：www.shining.cool\n(Add a witty line like 'Stop working OT today')."

**IMPORTANT: ALL OUTPUT MUST BE IN SIMPLIFIED CHINESE (简体中文).**
`;

// Helper to get API Key safely across environments
const getApiKey = (): string | undefined => {
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_KEY) {
    // @ts-ignore
    return import.meta.env.VITE_API_KEY;
  }
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
    return process.env.API_KEY;
  }
  return undefined;
};

// Lazy initialization function
const getAI = () => {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error("API Key not found.");
    throw new Error("API Key is missing.");
  }
  return new GoogleGenAI({ apiKey });
};

// Helper to clean and parse JSON
const cleanAndParseJson = <T>(text: string): T => {
  let cleanText = text.trim();
  if (cleanText.startsWith("```")) {
    cleanText = cleanText.replace(/^```(json)?/, "").replace(/```$/, "");
  }
  return JSON.parse(cleanText);
};

export const generateMarketingCopy = async (userPrompt?: string): Promise<GeneratedContentResponse> => {
  try {
    const ai = getAI();

    // 1. Randomly select an angle to ensure variety
    const randomAngle = CONTENT_ANGLES[Math.floor(Math.random() * CONTENT_ANGLES.length)];

    let promptText = `
    TODAY'S STRATEGY: ${randomAngle.name}
    STRATEGY INSTRUCTION: ${randomAngle.instruction}
    
    ${VIRAL_PRINCIPLES}

    Generate the marketing package based on this strategy.
    `;
    
    if (userPrompt && userPrompt.trim()) {
      promptText += `
      USER EXTRA CONTEXT: "${userPrompt}"
      Combine the User's context with the "${randomAngle.name}" strategy.
      `;
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            layoutStyle: { 
              type: Type.STRING, 
              enum: ["minimal", "handwritten", "comic", "magazine"],
              description: "The single unified visual style for all 4 cards."
            },
            xiaohongshu: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "Viral, click-bait style title." },
                content: { type: Type.STRING, description: "Authentic, high-value social copy." },
                tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Exactly 5 targeted hashtags." }
              },
              required: ["title", "content", "tags"]
            },
            cards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "Headline" },
                  subtitle: { type: Type.STRING, description: "Subhead" },
                  body: { type: Type.STRING, description: "Card content" },
                  visualPrompt: { type: Type.STRING, description: "Image generation prompt" },
                  tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Max 3 tags for card visual." },
                },
                required: ["title", "subtitle", "body", "visualPrompt", "tags"]
              }
            }
          },
          required: ["layoutStyle", "xiaohongshu", "cards"]
        }
      },
      contents: promptText,
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No data returned");
    
    const parsedData = JSON.parse(jsonText);
    
    // Distribute the global layoutStyle to each card
    const formattedCards = parsedData.cards.map((card: any, index: number) => ({
      ...card,
      id: index + 1,
      isPromoCard: index === 3,
      layoutStyle: parsedData.layoutStyle as CardLayoutStyle
    }));

    return {
      xiaohongshu: parsedData.xiaohongshu,
      cards: formattedCards
    };

  } catch (error) {
    console.error("Error generating copy:", error);
    throw error;
  }
};

export const generateCardImage = async (prompt: string): Promise<string> => {
  try {
    const apiKey = getApiKey();
    if (!apiKey) return `https://picsum.photos/seed/${Math.random()}/600/900`;
    
    const ai = new GoogleGenAI({ apiKey });

    // Updated visual style to be more "Lifestyle/Authentic" mixed with "High Tech"
    const enhancedPrompt = `
    Editorial photography, high-end lifestyle magazine style mixed with futuristic tech elements. 
    Aesthetic: Clean, minimalist, Apple-like but with a human touch. 
    Colors: International Klein Blue (#002FA7) accents, white, soft grays. 
    Subject: Abstract representation of: ${prompt}. 
    Lighting: Soft natural light, ambient occlusion. 
    Quality: 8k, highly detailed, photorealistic, unspash style. 
    No text, no letters.
    `;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [{ text: enhancedPrompt }]
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("No image data found in response");
  } catch (error) {
    console.error("Error generating image:", error);
    return `https://picsum.photos/seed/${Math.random()}/600/900`;
  }
};

export const fetchTrendingTopics = async (): Promise<string[]> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Using Google Search, find the top 15 trending search terms, hashtags, or hot topics on Xiaohongshu (Red Note) RIGHT NOW related to 'Video Production', 'Advertising', 'AI Art', 'Short Drama', or 'Marketing'. **Return ONLY a JSON array of strings in Simplified Chinese (简体中文).** Do not include markdown formatting or explanations.",
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    const text = response.text;
    if (!text) return [];
    return cleanAndParseJson<string[]>(text);
  } catch (error) {
    console.error("Error fetching trending topics:", error);
    return [];
  }
};

export const fetchViralStrategies = async (): Promise<{ title: string; desc: string }[]> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Using Google Search, find 4 current VIRAL content creation strategies or popular visual styles on Xiaohongshu for video creators/marketers. **Return ONLY a JSON array of objects in Simplified Chinese (简体中文)**, where each object has a 'title' (max 10 chars) and a 'desc' (max 30 chars). Example: [{'title': '3秒吸睛法', 'desc': '利用高饱和色彩开头抓住用户注意力'}]. Do not include markdown.",
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    const text = response.text;
    if (!text) return [];
    return cleanAndParseJson<{ title: string; desc: string }[]>(text);
  } catch (error) {
    console.error("Error fetching viral strategies:", error);
    return [];
  }
};
