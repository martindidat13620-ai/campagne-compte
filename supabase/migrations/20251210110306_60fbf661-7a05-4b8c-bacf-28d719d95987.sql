
-- Link existing orphan campaign "Legislative 2024" to Sandra Juriens
INSERT INTO public.comptable_campaigns (campaign_id, comptable_id)
VALUES ('6bc5829d-76d6-4396-9139-1f8bcfddf1fb', '8c816cff-5bfd-4f75-862c-a5da7b2e304e')
ON CONFLICT DO NOTHING;
