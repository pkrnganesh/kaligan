import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import multer from 'multer';
import pdf from 'pdf-parse';
import { queryContext, upsertVectors } from './services/ragService.js';
import { generateEmbedding } from './services/geminiService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3005;

// Multer memory storage configuration
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Middleware
app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://localhost:5173',
        'https://kreta-bandhu.vercel.app',  // Production frontend
        /\.vercel\.app$/,  // Allow all Vercel deployments
        /\.onrender\.com$/  // Allow all Render deployments
    ],
    credentials: true
}));
app.use(express.json());

// Serve static invoices/files if any exist
app.use('/invoices', express.static(path.join(__dirname, 'invoices')));
app.use(express.static(path.join(__dirname, 'public')));

// Helper: Split text into chunks
function chunkText(text, maxChunkSize = 1000) {
  const chunks = [];
  const paragraphs = text.split(/\n\n+/);
  let currentChunk = '';
  
  for (const paragraph of paragraphs) {
    const trimmedParagraph = paragraph.trim();
    if (!trimmedParagraph) continue;
    
    if (currentChunk.length + trimmedParagraph.length > maxChunkSize) {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      
      if (trimmedParagraph.length > maxChunkSize) {
        const sentences = trimmedParagraph.match(/[^.!?]+[.!?]+/g) || [trimmedParagraph];
        for (const sentence of sentences) {
          if (currentChunk.length + sentence.length > maxChunkSize) {
            if (currentChunk.length > 0) {
              chunks.push(currentChunk.trim());
            }
            currentChunk = sentence;
          } else {
            currentChunk += ' ' + sentence;
          }
        }
      } else {
        currentChunk = trimmedParagraph;
      }
    } else {
      currentChunk += (currentChunk.length > 0 ? '\n\n' : '') + trimmedParagraph;
    }
  }
  
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.trim());
  }
  return chunks;
}

// Helper: Generate vector ID
function generateVectorId(filename, index) {
  const timestamp = Date.now();
  const cleanFilename = path.basename(filename, path.extname(filename))
    .replace(/[^a-zA-Z0-9]/g, '_')
    .toLowerCase();
  return `upload_${cleanFilename}_chunk_${index}_${timestamp}`;
}

// RAG Upload Endpoint
app.post('/api/kb/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const filename = req.file.originalname;
        const ext = path.extname(filename).toLowerCase();
        let fileContent = '';

        console.log(`[Upload API] Processing uploaded file: ${filename} (${req.file.size} bytes)`);

        if (ext === '.pdf') {
            console.log('[Upload API] Parsing PDF document...');
            const parsedData = await pdf(req.file.buffer);
            fileContent = parsedData.text;
        } else if (ext === '.txt') {
            fileContent = req.file.buffer.toString('utf-8');
        } else {
            return res.status(400).json({ error: 'Unsupported file format. Please upload a .txt or .pdf file.' });
        }

        if (!fileContent.trim()) {
            return res.status(400).json({ error: 'Uploaded file is empty.' });
        }

        console.log('[Upload API] Chunking text...');
        const chunks = chunkText(fileContent, 1000);
        console.log(`[Upload API] Created ${chunks.length} chunks`);

        console.log('[Upload API] Generating embeddings...');
        const vectors = [];

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            try {
                const embedding = await generateEmbedding(chunk);
                vectors.push({
                    id: generateVectorId(filename, i),
                    values: embedding,
                    metadata: {
                        text: chunk,
                        source: filename,
                        chunkIndex: i,
                        totalChunks: chunks.length,
                        chunkLength: chunk.length,
                        ingestedAt: new Date().toISOString()
                    }
                });
            } catch (error) {
                console.warn(`[Upload API] Embedding failed for chunk ${i}, storing for keyword search fallback:`, error.message);
                vectors.push({
                    id: generateVectorId(filename, i),
                    values: [],
                    metadata: {
                        text: chunk,
                        source: filename,
                        chunkIndex: i,
                        totalChunks: chunks.length,
                        chunkLength: chunk.length,
                        ingestedAt: new Date().toISOString()
                    }
                });
            }
        }

        console.log('[Upload API] Upserting vectors to store...');
        await upsertVectors(vectors);
        console.log('[Upload API] Direct ingestion completed successfully!');

        res.json({
            status: 'success',
            message: `Successfully ingested ${chunks.length} chunks from ${filename}`,
            filename,
            chunksCount: chunks.length
        });

    } catch (err) {
        console.error('[Upload API] Error processing upload:', err);
        res.status(500).json({ error: err.message });
    }
});

// RAG Search Endpoint
app.get('/api/kb/query', async (req, res) => {
    const { q } = req.query;
    console.log(`[Backend API] /api/kb/query received query: "${q}"`);
    try {
        const context = await queryContext(q || '');
        res.json({ context });
    } catch (err) {
        console.error('[Backend API] Error querying context:', err);
        res.status(500).json({ error: err.message });
    }
});

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ 
        status: 'online',
        message: 'Kreta-Bandhu Backend API (RAG-Only) is running',
        endpoints: {
            kb_query: '/api/kb/query?q=query_string',
            kb_upload: 'POST /api/kb/upload (form-data: "file")'
        }
    });
});

app.listen(PORT, () => {
    console.log(`RAG Backend Server running on http://localhost:${PORT}`);
});
