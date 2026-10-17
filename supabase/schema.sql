-- Kitob kutubxona: ma'lumotlar bazasi sxemasi
-- Supabase loyihasida: SQL Editor -> shu faylni to'liq joylab, "Run" bosing.

-- ============ Jadvallar ============

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.genres (
  id bigint generated always as identity primary key,
  name text not null unique
);

create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text not null,
  description text,
  language text not null default 'uz',
  year int,
  pages int,
  cover_path text,          -- 'covers' bucket ichidagi yo'l
  pdf_path text not null,   -- 'books' bucket ichidagi yo'l
  license text,             -- masalan: "Ochiq litsenziya", "Muallif ruxsati"
  source text,              -- kitob qayerdan olingani
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.book_genres (
  book_id uuid references public.books(id) on delete cascade,
  genre_id bigint references public.genres(id) on delete cascade,
  primary key (book_id, genre_id)
);

create table if not exists public.reading_progress (
  user_id uuid references auth.users(id) on delete cascade,
  book_id uuid references public.books(id) on delete cascade,
  page int not null default 1,
  total_pages int,
  updated_at timestamptz not null default now(),
  primary key (user_id, book_id)
);

create table if not exists public.shelves (
  user_id uuid references auth.users(id) on delete cascade,
  book_id uuid references public.books(id) on delete cascade,
  shelf text not null check (shelf in ('reading', 'finished', 'later', 'favorite')),
  created_at timestamptz not null default now(),
  primary key (user_id, book_id, shelf)
);

create table if not exists public.reviews (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  body text,
  is_approved boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, book_id)
);

create table if not exists public.reports (
  id bigint generated always as identity primary key,
  book_id uuid not null references public.books(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  contact text,
  reason text not null,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

-- Kitob statistikasi: nechta odam o'qigan va o'rtacha baho
create or replace view public.book_stats
with (security_invoker = false) as
select
  b.id as book_id,
  (select count(*) from public.reading_progress rp where rp.book_id = b.id) as readers,
  (select round(avg(r.rating)::numeric, 1) from public.reviews r
     where r.book_id = b.id and r.is_approved) as avg_rating,
  (select count(*) from public.reviews r
     where r.book_id = b.id and r.is_approved) as review_count
from public.books b
where b.is_published;

grant select on public.book_stats to anon, authenticated;

-- ============ Yordamchi funksiyalar ============

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- Yangi foydalanuvchi ro'yxatdan o'tganda profil yaratiladi
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ Xavfsizlik (Row Level Security) ============

alter table public.profiles enable row level security;
alter table public.genres enable row level security;
alter table public.books enable row level security;
alter table public.book_genres enable row level security;
alter table public.reading_progress enable row level security;
alter table public.shelves enable row level security;
alter table public.reviews enable row level security;
alter table public.reports enable row level security;

-- profiles
drop policy if exists "profil: o'zini ko'radi" on public.profiles;
create policy "profil: o'zini ko'radi" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
drop policy if exists "profil: admin boshqaradi" on public.profiles;
create policy "profil: admin boshqaradi" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- genres
drop policy if exists "janr: hamma ko'radi" on public.genres;
create policy "janr: hamma ko'radi" on public.genres for select using (true);
drop policy if exists "janr: admin boshqaradi" on public.genres;
create policy "janr: admin boshqaradi" on public.genres
  for all using (public.is_admin()) with check (public.is_admin());

-- books
drop policy if exists "kitob: chop etilganini hamma ko'radi" on public.books;
create policy "kitob: chop etilganini hamma ko'radi" on public.books
  for select using (is_published or public.is_admin());
drop policy if exists "kitob: admin boshqaradi" on public.books;
create policy "kitob: admin boshqaradi" on public.books
  for all using (public.is_admin()) with check (public.is_admin());

-- book_genres
drop policy if exists "kitob-janr: hamma ko'radi" on public.book_genres;
create policy "kitob-janr: hamma ko'radi" on public.book_genres for select using (true);
drop policy if exists "kitob-janr: admin boshqaradi" on public.book_genres;
create policy "kitob-janr: admin boshqaradi" on public.book_genres
  for all using (public.is_admin()) with check (public.is_admin());

-- reading_progress
drop policy if exists "progress: o'ziniki" on public.reading_progress;
create policy "progress: o'ziniki" on public.reading_progress
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- shelves
drop policy if exists "javon: o'ziniki" on public.shelves;
create policy "javon: o'ziniki" on public.shelves
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- reviews
drop policy if exists "sharh: tasdiqlanganini hamma ko'radi" on public.reviews;
create policy "sharh: tasdiqlanganini hamma ko'radi" on public.reviews
  for select using (is_approved or user_id = auth.uid() or public.is_admin());
drop policy if exists "sharh: o'zi yozadi" on public.reviews;
create policy "sharh: o'zi yozadi" on public.reviews
  for insert with check (user_id = auth.uid() and is_approved = false);
drop policy if exists "sharh: o'zi o'chiradi" on public.reviews;
create policy "sharh: o'zi o'chiradi" on public.reviews
  for delete using (user_id = auth.uid() or public.is_admin());
drop policy if exists "sharh: admin tasdiqlaydi" on public.reviews;
create policy "sharh: admin tasdiqlaydi" on public.reviews
  for update using (public.is_admin()) with check (public.is_admin());

-- reports
drop policy if exists "shikoyat: hamma yuboradi" on public.reports;
create policy "shikoyat: hamma yuboradi" on public.reports
  for insert with check (user_id is null or user_id = auth.uid());
drop policy if exists "shikoyat: admin ko'radi" on public.reports;
create policy "shikoyat: admin ko'radi" on public.reports
  for all using (public.is_admin()) with check (public.is_admin());

-- ============ Fayl saqlash (Storage) ============

-- PDF'lar yopiq bucket'da (faqat vaqtinchalik havola orqali ochiladi),
-- muqovalar ochiq bucket'da.
insert into storage.buckets (id, name, public)
values ('books', 'books', false), ('covers', 'covers', true)
on conflict (id) do nothing;

drop policy if exists "pdf: kirganlar o'qiydi" on storage.objects;
create policy "pdf: kirganlar o'qiydi" on storage.objects
  for select to authenticated using (bucket_id = 'books');
drop policy if exists "muqova: hamma ko'radi" on storage.objects;
create policy "muqova: hamma ko'radi" on storage.objects
  for select using (bucket_id = 'covers');
drop policy if exists "fayl: admin yuklaydi" on storage.objects;
create policy "fayl: admin yuklaydi" on storage.objects
  for insert to authenticated with check (bucket_id in ('books', 'covers') and public.is_admin());
drop policy if exists "fayl: admin yangilaydi" on storage.objects;
create policy "fayl: admin yangilaydi" on storage.objects
  for update to authenticated using (bucket_id in ('books', 'covers') and public.is_admin());
drop policy if exists "fayl: admin o'chiradi" on storage.objects;
create policy "fayl: admin o'chiradi" on storage.objects
  for delete to authenticated using (bucket_id in ('books', 'covers') and public.is_admin());

-- ============ Boshlang'ich janrlar ============

insert into public.genres (name) values
  ('Badiiy adabiyot'), ('Ilmiy'), ('Darslik'), ('Tarix'), ('Bolalar uchun'),
  ('Biznes'), ('Shaxsiy rivojlanish'), ('Diniy'), ('Dasturlash'), ('She''riyat')
on conflict (name) do nothing;

-- ============ O'zingizni admin qilish ============
-- Saytda ro'yxatdan o'tganingizdan keyin quyidagini o'z emailingiz bilan ishga tushiring:
-- update public.profiles set role = 'admin'
--   where id = (select id from auth.users where email = 'SIZNING@EMAIL.uz');
