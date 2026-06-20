-- AlterTable
ALTER TABLE "conversations" ADD COLUMN     "call_sid" TEXT,
ADD COLUMN     "duration_sec" INTEGER;

-- AlterTable
ALTER TABLE "workspaces" ADD COLUMN     "expires_at" TIMESTAMPTZ,
ADD COLUMN     "is_demo" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" UUID NOT NULL,
    "stripe_customer_id" TEXT NOT NULL,
    "stripe_sub_id" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'starter',
    "status" TEXT NOT NULL DEFAULT 'active',
    "current_period_end" TIMESTAMPTZ,
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "agent_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "phone_numbers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" UUID NOT NULL,
    "agent_id" UUID NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'twilio',
    "e164" TEXT NOT NULL,
    "agent_token" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "auth_token_enc" TEXT,
    "recording_enabled" BOOLEAN NOT NULL DEFAULT false,
    "connected_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "phone_numbers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calls" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" UUID NOT NULL,
    "agent_id" UUID NOT NULL,
    "call_sid" TEXT NOT NULL,
    "from_number" TEXT NOT NULL,
    "duration_sec" INTEGER NOT NULL,
    "recording_url" TEXT,
    "latency_ms" INTEGER,
    "interruptions" INTEGER NOT NULL DEFAULT 0,
    "outcome" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calls_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_workspace_id_key" ON "subscriptions"("workspace_id");

-- CreateIndex
CREATE UNIQUE INDEX "phone_numbers_agent_token_key" ON "phone_numbers"("agent_token");

-- CreateIndex
CREATE UNIQUE INDEX "calls_call_sid_key" ON "calls"("call_sid");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phone_numbers" ADD CONSTRAINT "phone_numbers_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phone_numbers" ADD CONSTRAINT "phone_numbers_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calls" ADD CONSTRAINT "calls_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
