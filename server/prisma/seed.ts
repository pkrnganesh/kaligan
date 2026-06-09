import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as argon2 from 'argon2';
import { randomUUID } from 'crypto';

dotenv.config();

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set in environment variables');
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('Seeding database...');

  // 1. Create Workspace
  const workspaceId = randomUUID();
  const workspace = await prisma.workspace.create({
    data: {
      id: workspaceId,
      name: 'Demo Corp',
      websiteUrl: 'https://democorp.com',
      brandColor: '#0E7A5F',
      publicKey: 'ws_demo_key',
      plan: 'starter',
    },
  });
  console.log(`✓ Workspace created: ${workspace.name} (${workspace.id})`);

  // 2. Create Owner User
  const passwordHash = await argon2.hash('password123');
  const user = await prisma.user.create({
    data: {
      workspaceId,
      email: 'owner@kaligan.ai',
      name: 'Demo Owner',
      passwordHash,
      role: 'owner',
    },
  });
  console.log(`✓ Owner user created: ${user.email}`);

  // 3. Create Agent
  const agent = await prisma.agent.create({
    data: {
      workspaceId,
      kind: 'chat',
      name: 'Demo Chat Agent',
      status: 'live',
      persona: 'Friendly',
      greeting: 'Hello! I am your friendly Demo Chat Agent. How can I help you today?',
      goal: 'qualify',
      channels: { web: true, phone: false },
      captureFields: ['name', 'email'],
    },
  });
  console.log(`✓ Agent created: ${agent.name}`);

  // 4. Create KB Document
  const docId = randomUUID();
  const doc = await prisma.kbDocument.create({
    data: {
      id: docId,
      workspaceId,
      type: 'txt',
      name: 'sample_policy.txt',
      sourceUri: 'sample_policy.txt',
      status: 'ready',
      chunkCount: 1,
    },
  });
  console.log(`✓ KB Document created: ${doc.name}`);

  // 5. Create KB Chunk with 384-dimensional vector placeholder
  const chunkId = randomUUID();
  const content = 'Our refund policy allows returns within 30 days of purchase with a receipt. Refunds are issued to the original payment method within 5-7 business days.';
  
  // Create a 384-dimensional vector placeholder: [0.0100, 0.0101, 0.0102, ...]
  const vectorArray = Array.from({ length: 384 }, (_, i) => (0.01 + i * 0.0001).toFixed(4));
  const vectorStr = `[${vectorArray.join(',')}]`;

  await prisma.$executeRaw`
    INSERT INTO kb_chunks (id, workspace_id, document_id, chunk_index, content, embedding, token_len)
    VALUES (${chunkId}, ${workspaceId}, ${docId}, 0, ${content}, ${vectorStr}::vector, 30)
  `;
  console.log(`✓ KB Chunk created with pgvector embedding`);

  console.log('Seeding completed successfully!');
  await prisma.$disconnect();
  await pool.end();
}

main().catch((err) => {
  console.error('Error seeding database:', err);
  process.exit(1);
});
