-- CreateTable
CREATE TABLE "agent_versions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "agent_id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "config_snapshot" JSONB NOT NULL,
    "published_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_by" UUID,

    CONSTRAINT "agent_versions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "agent_versions" ADD CONSTRAINT "agent_versions_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_versions" ADD CONSTRAINT "agent_versions_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_versions" ADD CONSTRAINT "agent_versions_published_by_fkey" FOREIGN KEY ("published_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
