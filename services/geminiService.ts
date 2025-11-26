import { GoogleGenAI, Type } from "@google/genai";
import { MarketingCardData, GeneratedContentResponse } from "../types";

const SYSTEM_INSTRUCTION = `
You are the Chief Creative Officer for "Shining AI" (闪灵AI). 
Your task is to generate a complete daily marketing package consisting of:
1. A Xiaohongshu (Red Note) post (Title, Content, Tags) to promote the tool.
2. 4 daily marketing posters (H5 format).

**IMPORTANT: ALL OUTPUT TEXT MUST BE IN SIMPLIFIED CHINESE (简体中文).**

Product Core Features (Shining AI):
1. Natural Language Video Search (自然语言视频搜索): Visual recognition to find frames.
2. Online Storyboard (在线故事板): Add shot descriptions, convert images to sketches, export PPTs.
3. AI Favorites (AI收藏夹): Semantic search for collected content.

Target Audience: Ad people, Directors, Creative Directors, Video Creators.

Output Requirement:
Return a JSON Object with two main keys: "xiaohongshu" and "cards".

1. "xiaohongshu":
   - Title: Catchy, emoji-rich title (MAX 20 CHARACTERS). STRICT LIMIT.
   - Content: Engaging social media copy (approx 100-150 words) promoting Shining AI's efficiency.
   - Tags: 5-8 relevant hashtags.

2. "cards": An array of 4 distinct cards.
   - Card 1, 2, 3: Insightful marketing copy addressing user pain points.
   - Card 4: MUST be the "Welfare/Promo" card.
     - Title: "新手福利" or "限时领取"
     - Body: "1. 邀请新人注册送50算值\n2. 新注册用户送100算值\nPC体验网址：www.shining.cool"

Tone: Professional, Innovative, High-Tech, Aesthetic.
`;

// Helper to get API Key safely across environments
const getApiKey = (): string | undefined => {
  // 1. Try Vite's import.meta.env (Standard for Vite apps on Vercel)
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_KEY) {
    // @ts-ignore
    return import.meta.env.VITE_API_KEY;
  }

  // 2. Fallback to process.env (Node.js environments or if manually polyfilled)
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
    return process.env.API_KEY;
  }

  return undefined;
};

// Lazy initialization function
const getAI = () => {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error("API Key not found. Checked import.meta.env.VITE_API_KEY and process.env.API_KEY");
    throw new Error("API Key is missing. Please set VITE_API_KEY in your Vercel environment settings.");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateMarketingCopy = async (userPrompt?: string): Promise<GeneratedContentResponse> => {
  try {
    const ai = getAI(); // Initialize here, not at top level

    let promptText = "Generate today's marketing package (Xiaohongshu post + 4 cards).";
    
    if (userPrompt && userPrompt.trim()) {
      promptText = `
      USER INSTRUCTION: "${userPrompt}"
      
      Please modify the content to strictly align with the User Instruction above. 
      If the user asks for a specific style, apply it to both the Xiaohongshu post and the cards.
      Card 4 MUST still be the standard promo card.
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
            xiaohongshu: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "Social media title with emojis. MAX 20 CHARACTERS." },
                content: { type: Type.STRING, description: "Main post body text" },
                tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Hashtags" }
              },
              required: ["title", "content", "tags"]
            },
            cards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "Main headline (max 10 chars)" },
                  subtitle: { type: Type.STRING, description: "Sub-headline" },
                  body: { type: Type.STRING, description: "Main copy, 2-3 sentences." },
                  visualPrompt: { type: Type.STRING, description: "Visual description for background. Apple/Google aesthetic, Klein Blue & White." },
                  tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 keywords" },
                },
                required: ["title", "subtitle", "body", "visualPrompt", "tags"]
              }
            }
          },
          required: ["xiaohongshu", "cards"]
        }
      },
      contents: promptText,
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No data returned");
    
    const parsedData = JSON.parse(jsonText) as GeneratedContentResponse;
    
    // Map IDs to cards
    parsedData.cards = parsedData.cards.map((card, index) => ({
      ...card,
      id: index + 1,
      isPromoCard: index === 3
    }));

    return parsedData;

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

    const enhancedPrompt = `High-end minimalist design, Apple style, Google Material Design 3D, International Klein Blue (#002FA7) and Matte White color palette. Abstract geometric shapes, soft ambient occlusion shadows, clean composition, futuristic corporate art, 8k resolution, ${prompt}. No text, no letters, no characters. Bright, airy, and premium.`;
    
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