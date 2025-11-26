export interface MarketingCardData {
  id: number;
  title: string;
  subtitle: string;
  body: string;
  visualPrompt: string; // The prompt used to generate the background image
  tags: string[];
  isPromoCard?: boolean;
}

export interface XiaohongshuContent {
  title: string;
  content: string;
  tags: string[];
}

export interface GeneratedContentResponse {
  xiaohongshu: XiaohongshuContent;
  cards: Omit<MarketingCardData, 'id'>[];
}

export interface GeneratedImage {
  cardId: number;
  imageUrl: string;
}

export enum GenerationStep {
  IDLE = 'IDLE',
  GENERATING_COPY = 'GENERATING_COPY',
  GENERATING_IMAGES = 'GENERATING_IMAGES',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}