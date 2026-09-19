-- Feature expansion: richer diagnoses, care profiles, and a privacy-blurred community map.
-- Everything is additive (`add column if not exists`), so it is safe to run on a project
-- that already has data.

-- Plants carry a lightweight care profile: light, watering interval, temperature range and
-- frost sensitivity. It feeds the care calendar defaults and the weather alerts.
alter table public.plants
  add column if not exists care_profile jsonb;

-- Reports keep the structured pieces of a diagnosis, not just its prose, so the growth chart,
-- companion-planting tips and reminders can be rebuilt from them later.
alter table public.reports
  add column if not exists scientific_name text,
  add column if not exists identification_confidence text
    check (identification_confidence in ('low', 'medium', 'high')),
  add column if not exists severity_score smallint
    check (severity_score between 0 and 10),
  add column if not exists companion_tip text,
  add column if not exists native_alternative text,
  add column if not exists care_profile jsonb,
  add column if not exists care_tasks jsonb,
  -- The geohash of the cell the report was pinned to. `lat`/`lng` hold that cell's centre, so
  -- neither ever contains an exact position. Precision 6 is about 1.2 km x 0.6 km, and 7 is
  -- about 150 m.
  add column if not exists geohash text;

-- "Near me" queries use a bounding box on lat/lng; growth tracking reads one person's
-- reports in date order.
create index if not exists reports_lat_lng_idx on public.reports (lat, lng)
  where lat is not null and lng is not null;
create index if not exists reports_user_created_idx on public.reports (user_id, created_at);

-- Privacy: reports saved before location blurring existed may hold exact coordinates from a
-- device. Round them to two decimal places (about 1 km) so nothing precise stays public.
update public.reports
set lat = round(lat::numeric, 2)::double precision,
    lng = round(lng::numeric, 2)::double precision
where geohash is null
  and lat is not null
  and lng is not null;
