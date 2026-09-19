-- A plant profile. Private to the owner (unlike reports, which are public), since a
-- profile can carry a name and photos someone may not want shared with the community.
create table if not exists public.plants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  species text,
  photo_urls text[] not null default '{}',
  environment text check (environment in ('indoor', 'outdoor')),
  planting_date date,
  location text,
  health_status text not null default 'unknown' check (
    health_status in ('healthy', 'needs_attention', 'critical', 'unknown')
  ),
  created_at timestamptz not null default now()
);

alter table public.plants enable row level security;

create policy "Users can view their own plants"
on public.plants for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own plants"
on public.plants for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own plants"
on public.plants for update
to authenticated
using (auth.uid() = user_id);

create policy "Users can delete their own plants"
on public.plants for delete
to authenticated
using (auth.uid() = user_id);

create index if not exists plants_user_id_idx on public.plants (user_id);

-- Plant diagnosis reports. Publicly readable (powers the community "trending near
-- you" layer) but only the reporting user can create/edit their own row. Optionally
-- linked to a plant profile (plant_id), so a report can also exist as a one-off scan
-- with no profile attached.
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plant_id uuid references public.plants (id) on delete set null,
  photo_urls text[] not null default '{}',
  plant_name text not null,
  category text not null check (
    category in (
      'nutrient_deficiency', 'pest_damage', 'disease', 'water_stress', 'healthy', 'unknown'
    )
  ),
  summary text not null,
  fix text not null,
  confidence text not null check (confidence in ('low', 'medium', 'high')),
  health_status text not null default 'unknown' check (
    health_status in ('healthy', 'needs_attention', 'critical', 'unknown')
  ),
  possible_causes text[] not null default '{}',
  recommended_actions text[] not null default '{}',
  urgency text check (urgency in ('low', 'medium', 'high')),
  follow_up_days integer,
  limitations text,
  lat double precision,
  lng double precision,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.reports enable row level security;

create policy "Reports are publicly readable"
on public.reports for select
to public
using (true);

create policy "Users can insert their own reports"
on public.reports for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own reports"
on public.reports for update
to authenticated
using (auth.uid() = user_id);

create policy "Users can delete their own reports"
on public.reports for delete
to authenticated
using (auth.uid() = user_id);

create index if not exists reports_created_at_idx on public.reports (created_at desc);
create index if not exists reports_plant_name_idx on public.reports (plant_name);
create index if not exists reports_plant_id_idx on public.reports (plant_id);

-- One "this was helpful" reaction per user per report. Publicly readable so anyone can
-- see counts; a user can only insert/delete their own reaction (so the count reflects
-- distinct people, and toggling it off is just deleting their own row).
create table if not exists public.report_reactions (
  report_id uuid not null references public.reports (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (report_id, user_id)
);

alter table public.report_reactions enable row level security;

create policy "Reactions are publicly readable"
on public.report_reactions for select
to public
using (true);

create policy "Users can add their own reaction"
on public.report_reactions for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can remove their own reaction"
on public.report_reactions for delete
to authenticated
using (auth.uid() = user_id);

-- AI provider API keys. RLS is enabled with NO policies, which denies all access to
-- the anon/authenticated roles used by the browser client. Only Edge Functions using
-- the service_role key (which bypasses RLS) can read or write this table.
create table if not exists public.secrets (
  provider text primary key check (provider in ('claude', 'openai', 'gemini')),
  api_key text not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id)
);

alter table public.secrets enable row level security;

-- Small key/value config table. Same lockdown as `secrets`: service_role only.
-- Currently holds a single row, key = 'active_provider'.
create table if not exists public.app_config (
  key text primary key,
  value text
);

alter table public.app_config enable row level security;

-- Storage bucket for plant photos, public read (same reasoning as `reports`), and
-- uploads restricted to the authenticated user's own folder
-- (plant-photos/<user_id>/<file>), mirroring how paths were scoped before.
insert into storage.buckets (id, name, public)
values ('plant-photos', 'plant-photos', true)
on conflict (id) do nothing;

create policy "Public read for plant photos"
on storage.objects for select
to public
using (bucket_id = 'plant-photos');

create policy "Users can upload their own plant photos"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'plant-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can replace their own plant photos"
on storage.objects for update
to authenticated
using (
  bucket_id = 'plant-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);
