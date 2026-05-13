-- Seed data для розробки
-- Блок 02

INSERT INTO tenants (clerk_org_id, name, phone_number_source, whatsapp_connected)
VALUES ('dev_org_placeholder', 'Dev Coach', 'own', false)
ON CONFLICT (clerk_org_id) DO NOTHING;
