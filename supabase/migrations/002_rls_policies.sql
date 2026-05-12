-- RLS policies для всіх таблиць
-- Блок 02 — ізоляція тенантів

-- Увімкнути RLS на всіх таблицях
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE promises ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_items ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- tenants
-- ============================================================
CREATE POLICY "tenants_tenant_isolation" ON tenants
  FOR ALL
  USING (clerk_org_id = auth.jwt() ->> 'org_id');

-- ============================================================
-- clients
-- ============================================================
CREATE POLICY "clients_tenant_isolation" ON clients
  FOR ALL
  USING (tenant_id = (
    SELECT id FROM tenants
    WHERE clerk_org_id = auth.jwt() ->> 'org_id'
  ));

-- ============================================================
-- messages
-- ============================================================
CREATE POLICY "messages_tenant_isolation" ON messages
  FOR ALL
  USING (tenant_id = (
    SELECT id FROM tenants
    WHERE clerk_org_id = auth.jwt() ->> 'org_id'
  ));

-- ============================================================
-- promises
-- ============================================================
CREATE POLICY "promises_tenant_isolation" ON promises
  FOR ALL
  USING (tenant_id = (
    SELECT id FROM tenants
    WHERE clerk_org_id = auth.jwt() ->> 'org_id'
  ));

-- ============================================================
-- templates
-- ============================================================
-- Системні шаблони (tenant_id IS NULL) бачать всі
-- Шаблони конкретного тенанта — тільки цей тенант
CREATE POLICY "templates_tenant_isolation" ON templates
  FOR ALL
  USING (
    tenant_id IS NULL
    OR tenant_id = (
      SELECT id FROM tenants
      WHERE clerk_org_id = auth.jwt() ->> 'org_id'
    )
  );

-- ============================================================
-- knowledge_items
-- ============================================================
-- Глобальні items (tenant_id IS NULL) бачать всі
-- Items конкретного тенанта — тільки цей тенант
CREATE POLICY "knowledge_items_tenant_isolation" ON knowledge_items
  FOR ALL
  USING (
    tenant_id IS NULL
    OR tenant_id = (
      SELECT id FROM tenants
      WHERE clerk_org_id = auth.jwt() ->> 'org_id'
    )
  );

-- ============================================================
-- audit_log — КРИТИЧНО: тільки INSERT
-- ============================================================
CREATE POLICY "audit_log_insert_only" ON audit_log
  FOR INSERT
  WITH CHECK (tenant_id = (
    SELECT id FROM tenants
    WHERE clerk_org_id = auth.jwt() ->> 'org_id'
  ));

-- SELECT дозволений тільки service_role (не через клієнт)
