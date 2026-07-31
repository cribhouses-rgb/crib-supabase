-- ============================================================================
-- Student Crib — Storage policies for the "photos" bucket
-- ============================================================================
-- Marking a bucket "Public" in the Supabase dashboard only controls
-- whether uploaded files are readable via a plain public URL — it does
-- NOT automatically allow anyone to upload/update/delete. Those still go
-- through RLS on the storage.objects table, same mechanism as our own
-- tables. Run this after creating the "photos" bucket.
--
-- NOTE: unlike 01_schema.sql / 02_rls_policies.sql, this file could not
-- be tested against a local Postgres instance the way the rest of the
-- schema was — storage.objects is a Supabase-managed table that doesn't
-- exist on plain Postgres, so this is based on Supabase's documented
-- conventions rather than a locally-verified test. Worth double-checking
-- the first real upload works as expected.
-- ============================================================================

-- Anyone can view/download photos (needed since listing/marketplace
-- photos are shown to any signed-in user browsing the app).
create policy "photos_public_read"
on storage.objects for select
using (bucket_id = 'photos');

-- Any signed-in user can upload — ownership is checked at update/delete
-- time, not upload time (matches the pattern of "anyone can create a
-- listing/marketplace item they own" in the table RLS policies).
create policy "photos_authenticated_upload"
on storage.objects for insert
with check (bucket_id = 'photos' and auth.role() = 'authenticated');

-- Only the person who uploaded a file can replace or remove it.
create policy "photos_owner_update"
on storage.objects for update
using (bucket_id = 'photos' and owner = auth.uid());

create policy "photos_owner_delete"
on storage.objects for delete
using (bucket_id = 'photos' and owner = auth.uid());
