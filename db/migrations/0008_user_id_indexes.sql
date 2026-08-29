-- Speed up per-user lookups as pantry_items/receipts grow.
create index pantry_items_user_id_idx on pantry_items (user_id);
create index receipts_user_id_idx on receipts (user_id);
