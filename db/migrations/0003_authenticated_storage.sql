-- Allow authenticated users to upload and read receipt images in their own
-- folder. The application stores objects as <auth user id>/<filename>.

insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

create policy "Authenticated users can upload own receipts"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "Authenticated users can read own receipts"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "Authenticated users can delete own receipts"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

-- Receipt line items are created by the authenticated receipt upload flow.
create policy "Users can insert own receipt line items"
  on receipt_line_items for insert
  to authenticated
  with check (
    exists (
      select 1 from receipts
      where receipts.id = receipt_line_items.receipt_id
      and receipts.user_id = auth.uid()
    )
  );