import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FlagEmbedding, EmbeddingModel } from 'fastembed';

@Injectable()
export class RagService implements OnModuleInit {
  private readonly logger = new Logger(RagService.name);
  private model: FlagEmbedding | null = null;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.logger.log('Initializing fastembed model...');
    try {
      this.model = await FlagEmbedding.init({
        model: EmbeddingModel.BGESmallENV15,
      });
      this.logger.log('fastembed BAAI/bge-small-en-v1.5 model initialized successfully.');
    } catch (err) {
      this.logger.error('Failed to initialize fastembed model:', err);
    }
  }

  private async getModel(): Promise<FlagEmbedding> {
    if (!this.model) {
      this.model = await FlagEmbedding.init({
        model: EmbeddingModel.BGESmallENV15,
      });
    }
    return this.model;
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const model = await this.getModel();
    const embeddingsGenerator = model.embed(texts, 10);
    const embeddings: number[][] = [];
    for await (const batch of embeddingsGenerator) {
      embeddings.push(...batch);
    }
    return embeddings;
  }

  async generateQueryEmbedding(text: string): Promise<number[]> {
    const model = await this.getModel();
    return await model.queryEmbed(text);
  }

  /**
   * Split text into chunks of approximately target characters,
   * carrying overlap characters from the previous chunk.
   */
  chunkText(text: string, target = 900, overlap = 120): string[] {
    const chunks: string[] = [];
    
    // Normalize whitespace
    const cleanText = text.replace(/[ \t]+/g, ' ').trim();
    const paragraphs = cleanText.split(/\n\n+/);
    
    let currentChunk = '';
    
    for (const paragraph of paragraphs) {
      const trimmedParagraph = paragraph.trim();
      if (!trimmedParagraph) continue;
      
      // If adding this paragraph fits within target
      if (currentChunk.length + (currentChunk ? 2 : 0) + trimmedParagraph.length <= target) {
        currentChunk = currentChunk ? currentChunk + '\n\n' + trimmedParagraph : trimmedParagraph;
      } else {
        // Push the current chunk
        if (currentChunk.length > 0) {
          chunks.push(currentChunk.trim());
        }
        
        // If the paragraph itself exceeds target, split it by sentence boundaries
        if (trimmedParagraph.length > target) {
          const sentences = trimmedParagraph.match(/[^.!?]+[.!?]+/g) || [trimmedParagraph];
          for (const sentence of sentences) {
            const trimmedSentence = sentence.trim();
            if (!trimmedSentence) continue;
            
            // Determine overlap to carry over from the previously pushed chunk
            let carriedOverlap = '';
            if (chunks.length > 0) {
              const prevChunk = chunks[chunks.length - 1];
              const maxOverlap = Math.max(0, target - trimmedSentence.length - 1);
              const actualOverlap = Math.min(overlap, maxOverlap);
              if (actualOverlap > 0) {
                carriedOverlap = prevChunk.substring(prevChunk.length - actualOverlap).trim();
              }
            }
            
            if (currentChunk.length + (currentChunk ? 1 : 0) + trimmedSentence.length <= target) {
              currentChunk = currentChunk ? currentChunk + ' ' + trimmedSentence : (carriedOverlap ? carriedOverlap + ' ' + trimmedSentence : trimmedSentence);
            } else {
              if (currentChunk.length > 0) {
                chunks.push(currentChunk.trim());
              }
              
              // Set currentChunk to the new sentence with overlap from the last pushed chunk
              let newOverlap = '';
              if (chunks.length > 0) {
                const prevChunk = chunks[chunks.length - 1];
                const maxOverlap = Math.max(0, target - trimmedSentence.length - 1);
                const actualOverlap = Math.min(overlap, maxOverlap);
                if (actualOverlap > 0) {
                  newOverlap = prevChunk.substring(prevChunk.length - actualOverlap).trim();
                }
              }
              currentChunk = newOverlap ? newOverlap + ' ' + trimmedSentence : trimmedSentence;
            }
          }
        } else {
          // Paragraph fits within target. Carry over overlap from the last pushed chunk.
          let carriedOverlap = '';
          if (chunks.length > 0) {
            const prevChunk = chunks[chunks.length - 1];
            const maxOverlap = Math.max(0, target - trimmedParagraph.length - 2);
            const actualOverlap = Math.min(overlap, maxOverlap);
            if (actualOverlap > 0) {
              carriedOverlap = prevChunk.substring(prevChunk.length - actualOverlap).trim();
            }
          }
          currentChunk = carriedOverlap ? carriedOverlap + '\n\n' + trimmedParagraph : trimmedParagraph;
        }
      }
    }
    
    if (currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks.filter(c => c.length > 0);
  }
}
