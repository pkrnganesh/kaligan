import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as argon2 from 'argon2';
import { randomUUID } from 'crypto';
import { FlagEmbedding, EmbeddingModel } from 'fastembed';

dotenv.config();

// Knowledge base content for KaliGanAI details
const KB_TEXT = `
KaliGanAI Product Details:
- Positioning: An AI employee that turns website visitors and callers into qualified leads over chat and voice.
- Differentiators: One unified AI employee that handles both text chat and real-time voice calls. Grounded strictly in your business data, ensuring 100% accurate answers with no hallucinations.
- Target Audience: Small and medium businesses (SMBs), agencies, consultants, SaaS startups, real estate brokers, and home service providers.
- Key Features:
  1. Grounded Chat: Answers questions strictly using uploaded files, FAQs, or website URLs. Gracefully captures visitor details when buying intent is shown or when answers are not found.
  2. Web & Phone Voice: An in-browser voice connection or a dedicated incoming phone number call line. Speaks naturally with low latency.
  3. Lead Capture & Qualification: Automatically parses contact fields (name, email, phone) and scores every conversation as Hot, Warm, or Cold based on buying intent.
  4. One clean dashboard: Provides analytics on conversation count, parsed leads, and hot opportunities.
- Pricing Toggles & Tiers:
  - Starter Plan: $39/month (Monthly) or $31/month (Yearly, save 20%). Includes website chat AI, answers from knowledge base, lead capture + scoring, up to 500 messages per month.
  - Growth Plan: $129/month (Monthly) or $99/month (Yearly, save 20%). Includes everything in Starter, web voice agent, 120 voice minutes/month, unlimited chat conversations, BYON (Bring Your Own Number) option, branding removal, priority email/chat support.
  - Agency Plan: Custom pricing. Includes white-labeling, unlimited voice minutes (volume usage), dedicated phone numbers, multi-workspace team access, custom SLA.
- Installation: Paste one snippet script tag on your website (WordPress, React, Shopify, HTML). Go live in under 5 minutes.
- Safety & Grounding: The AI is locked strictly to compose replies under 30 words per turn for voice, without markdown, and only using query_knowledge_base tool. It never invents facts.
`.trim();

function chunkText(text: string, target = 900, overlap = 120): string[] {
  const chunks: string[] = [];
  const cleanText = text.replace(/[ \t]+/g, ' ').trim();
  const paragraphs = cleanText.split(/\n\n+/);
  let currentChunk = '';
  
  for (const paragraph of paragraphs) {
    const trimmedParagraph = paragraph.trim();
    if (!trimmedParagraph) continue;
    
    if (currentChunk.length + (currentChunk ? 2 : 0) + trimmedParagraph.length <= target) {
      currentChunk = currentChunk ? currentChunk + '\n\n' + trimmedParagraph : trimmedParagraph;
    } else {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = trimmedParagraph;
    }
  }
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.trim());
  }
  return chunks.filter(c => c.length > 0);
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set in environment variables');
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('Starting seed-hello script...');

  // Check if hello@kaliganai.com already exists
  const existingUser = await prisma.user.findFirst({
    where: { email: 'hello@kaliganai.com' }
  });

  if (existingUser) {
    console.log('✓ Account hello@kaliganai.com already exists. Exiting script.');
    await prisma.$disconnect();
    await pool.end();
    return;
  }

  // 1. Create Workspace for KaliGanAI
  const workspaceId = randomUUID();
  const workspacePublicKey = 'ws_hello_key';
  const workspace = await prisma.workspace.create({
    data: {
      id: workspaceId,
      name: 'KaliGanAI',
      websiteUrl: 'https://kaliganai.com',
      brandColor: '#0B6E54',
      publicKey: workspacePublicKey,
      plan: 'growth',
    },
  });
  console.log(`✓ Workspace created: ${workspace.name} with key: ${workspace.publicKey}`);

  // 2. Create User account hello@kaliganai.com
  const passwordHash = await argon2.hash('password123');
  const user = await prisma.user.create({
    data: {
      workspaceId,
      email: 'hello@kaliganai.com',
      name: 'KaliGanAI Admin',
      passwordHash,
      role: 'owner',
    },
  });
  console.log(`✓ Owner user created: ${user.email} (Password: password123)`);

  // 3. Create Chat Agent Employee
  const agentId = randomUUID();
  const agent = await prisma.agent.create({
    data: {
      id: agentId,
      workspaceId,
      kind: 'chat',
      name: 'KaliGanAI Assistant',
      status: 'live',
      persona: 'Friendly',
      greeting: 'Hello! I am your KaliGanAI Assistant. I can help you learn more about our AI employees, pricing, voice features, and setup. How can I help you today?',
      goal: 'qualify',
      channels: { web: true, phone: false },
      captureFields: ['name', 'email', 'phone'],
      voiceName: 'Maya',
    },
  });
  console.log(`✓ Chat Agent created: ${agent.name} (${agent.id})`);

  // 4. Create KB Document
  const docId = randomUUID();
  const doc = await prisma.kbDocument.create({
    data: {
      id: docId,
      workspaceId,
      type: 'txt',
      name: 'kaliganai_details.txt',
      sourceUri: 'kaliganai_details.txt',
      status: 'processing',
      chunkCount: 0,
    },
  });
  console.log(`✓ KB Document created: ${doc.name}`);

  // 5. Chunk the text and generate embeddings
  console.log('Generating chunks and fastembed vectors...');
  const chunks = chunkText(KB_TEXT);
  console.log(`Generated ${chunks.length} chunks. Loading BGESmallENV15 model...`);
  
  const embeddingModel = await FlagEmbedding.init({
    model: EmbeddingModel.BGESmallENV15,
  });

  const embeddingsGenerator = embeddingModel.embed(chunks, 10);
  const embeddings: number[][] = [];
  for await (const batch of embeddingsGenerator) {
    embeddings.push(...batch);
  }

  // 6. Bulk Insert chunks with pgvector using executeRaw
  console.log('Inserting chunks into database...');
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const embedding = embeddings[i];
    const embeddingString = `[${embedding.join(',')}]`;
    const chunkId = randomUUID();

    await prisma.$executeRaw`
      INSERT INTO kb_chunks (id, workspace_id, document_id, chunk_index, content, embedding, token_len)
      VALUES (${chunkId}::uuid, ${workspaceId}::uuid, ${docId}::uuid, ${i}, ${chunk}, ${embeddingString}::vector, 120)
    `;
  }

  // Update doc and agent status
  await prisma.kbDocument.update({
    where: { id: docId },
    data: { status: 'ready', chunkCount: chunks.length }
  });

  await prisma.agent.update({
    where: { id: agent.id },
    data: { connectedKbDocumentIds: [docId] }
  });

  console.log('✓ Seeding complete! hello@kaliganai.com account and knowledge successfully initialized.');

  await prisma.$disconnect();
  await pool.end();
}

main().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
