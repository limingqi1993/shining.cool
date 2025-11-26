import { GoogleGenAI, Type } from "@google/genai";
import { MarketingCardData } from "../types";

// Access environment variables using process.env.API_KEY as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are the Chief Creative Officer for "Shining AI" (闪灵AI). 
Your task is to generate content for 4 daily marketing posters (H5 format) targeting advertising professionals, directors, creative directors, and video creators.

**IMPORTANT: ALL OUTPUT TEXT (Title, Subtitle, Body, Tags) MUST BE IN SIMPLIFIED CHINESE (简体中文).**

Product Core Features (Shining AI):
1. Natural Language Video Search (自然语言视频搜索): Visual recognition to understand video content and find specific frames instantly.
2. Online Storyboard (在线故事板): Add shot descriptions, convert images to storyboards/sketches, export formatted PPTs, and auto-generate creative briefs/project backgrounds.
3. AI Favorites (AI收藏夹): Use natural language to search through your saved/collected content.

Target Audience: Ad people, Directors, Creative Directors, Video Creators, Influencers.

Output Requirement:
Generate 4 distinct cards in a JSON array.
- Card 1, 2, and 3: Focus on pain points or specific user requests. Use sharp, insightful, and slightly provocative copywriting in Chinese.
- Card 4: MUST be the "Welfare/Promo" card. 
  - Title: "新手福利" or "限时领取"
  - Body must include: "1. 邀请新人注册送50算值", "2. 新注册用户送100算值", "PC体验网址：www.shining.cool".

Tone: Professional, Innovative, High-Tech, Efficient, Aesthetic.
`;

export const generateMarketingCopy = async (userPrompt?: string): Promise<MarketingCardData[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please set 'API_KEY' in your Environment Variables.");
  }

  try {
    let promptText = "Generate today's 4 marketing cards based on the system instructions.";
    
    if (userPrompt && userPrompt.trim()) {
      promptText = `
      USER INSTRUCTION: "${userPrompt}"
      
      Please modify the content of Cards 1, 2, and 3 to strictly align with the User Instruction above. 
      If the user asks for a specific style (e.g., 'storytelling'), write the copy in that style.
      If the user asks for trends (e.g., 'hot spots'), incorporate relevant current marketing/tech trends into the copy.
      
      Card 4 MUST still be the standard promo card as defined in the system instructions.
      `;
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Main headline in Chinese, catchy and short (max 10 chars)" },
              subtitle: { type: Type.STRING, description: "Sub-headline in Chinese explaining the benefit" },
              body: { type: Type.STRING, description: "Main copy in Chinese, 2-3 sentences max." },
              visualPrompt: { type: Type.STRING, description: "A detailed visual description for the background. Focus on Apple/Google high-end corporate aesthetics: 3D abstract shapes, soft shadows, glass morphism, fluid geometry. Dominant colors: PURE WHITE and KLEIN BLUE (#002FA7). No text, no people." },
              tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 keywords in Chinese" },
            },
            required: ["title", "subtitle", "body", "visualPrompt", "tags"]
          }
        }
      },
      contents: promptText,
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No data returned");
    
    const parsedData = JSON.parse(jsonText) as Omit<MarketingCardData, 'id'>[];
    
    // Map to add IDs and identify the promo card
    return parsedData.map((card, index) => ({
      ...card,
      id: index + 1,
      isPromoCard: index === 3 // The 4th card (index 3) is always the promo card based on instructions
    }));

  } catch (error) {
    console.error("Error generating copy:", error);
    throw error;
  }
};

export const generateCardImage = async (prompt: string): Promise<string> => {
  if (!process.env.API_KEY) return `https://picsum.photos/seed/${Math.random()}/600/900`;

  try {
    // We append specific style instructions to ensure consistency
    // Refined for Apple/Google aesthetic + Klein Blue/White
    const enhancedPrompt = `High-end minimalist design, Apple style, Google Material Design 3D, International Klein Blue (#002FA7) and Matte White color palette. Abstract geometric shapes, soft ambient occlusion shadows, clean composition, futuristic corporate art, 8k resolution, ${prompt}. No text, no letters, no characters. Bright, airy, and premium.`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [{ text: enhancedPrompt }]
      },
    });

    // Extract image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("No image data found in response");
  } catch (error) {
    console.error("Error generating image:", error);
    // Return a fallback placeholder if generation fails to avoid breaking the UI
    return `https://picsum.photos/seed/${Math.random()}/600/900`;
  }
};