-- Optional presentation-specific image. Existing products.image_url remains the fallback.
-- Nullable and without backfill, so existing catalog data is preserved.
alter table public.product_variants
  add column image_url text,
  add constraint product_variants_image_url_length_check
    check (image_url is null or char_length(image_url) <= 2048);

comment on column public.product_variants.image_url
  is 'Optional presentation-specific image URL; use products.image_url when null.';
