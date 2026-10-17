# Kitob kutubxona

PDF kitoblar uchun umumiy onlayn kutubxona. Admin kitob qo'shadi, foydalanuvchilar katalogdan tanlab, brauzerning o'zida qulay o'qiydi.

## Imkoniyatlar

**Foydalanuvchi uchun**
- Bosh sahifa: "Davom ettirish", "Yangi qo'shilganlar", "Eng ko'p o'qilganlar", janrlar
- Katalog: nomi, muallifi yoki tavsifi bo'yicha qidiruv; janr, til bo'yicha filtr; saralash
- Kitob sahifasi: muqova, ma'lumotlar, baho va sharhlar, litsenziya va manba, "Shikoyat qilish"
- O'quvchi oyna:
  - varaqlash (tugmalar, klaviatura ← →, telefonda surish), sahifaga o'tish
  - kattalashtirish / kichraytirish
  - oq, sepia va tungi rejim
  - mundarija (PDF ichida bo'lsa) va kitob ichidan so'z qidirish
  - to'liq ekran; ikki marta bosilsa menyular yashiriladi
  - qayerda to'xtagani avtomatik saqlanadi va istalgan qurilmada davom etadi
- "Mening javonim": O'qilyapti, O'qildi, Keyinroq o'qiyman, Sevimlilar
- Email + parol yoki Google orqali kirish

**Admin panel** (`/admin`)
- Kitob qo'shish: PDF tanlansa, muqova birinchi sahifadan, sahifalar soni va nomi fayldan avtomatik olinadi
- Tahrirlash, yashirish / chop etish, o'chirish
- Janrlarni boshqarish
- Sharhlarni tasdiqlash yoki o'chirish
- Shikoyatlarni ko'rib chiqish (kitobni bir tugmada yashirish)
- Statistika: kitoblar, foydalanuvchilar, o'qishlar, eng ko'p o'qilganlar

**Xavfsizlik**
- PDF fayllar yopiq joyda saqlanadi va faqat kirgan foydalanuvchiga 1 soatlik vaqtinchalik havola orqali ochiladi
- Ma'lumotlar bazasida Row Level Security: kitob qo'shish, tahrirlash va sharh tasdiqlash faqat admin uchun

## Texnologiyalar

React 18 + Vite, React Router, [pdf.js](https://mozilla.github.io/pdf.js/), [Supabase](https://supabase.com) (kirish, Postgres, fayl saqlash).

## Ishga tushirish

### 1. Supabase loyihasini yaratish
1. [supabase.com](https://supabase.com) da ro'yxatdan o'ting va **New project** yarating (bepul tarif yetarli).
2. **SQL Editor** ni oching, [`supabase/schema.sql`](supabase/schema.sql) faylining hammasini joylab, **Run** bosing. Bu jadvallar, xavfsizlik qoidalari, fayl saqlash joylari va boshlang'ich janrlarni yaratadi.
3. **Project Settings → API** bo'limidan `Project URL` va `anon public` kalitini oling.
4. (Ixtiyoriy) Google orqali kirish uchun: **Authentication → Providers → Google** ni yoqing.
5. **Authentication → URL Configuration** da `Site URL` ga saytingiz manzilini yozing (lokalda `http://localhost:5173`).

### 2. Dasturni kompyuterda ishga tushirish
Node.js 18+ kerak.

```bash
npm install
cp .env.example .env     # va ichiga 3-qadamdagi ikki qiymatni yozing
npm run dev
```

Brauzerda `http://localhost:5173` ni oching.

### 3. O'zingizni admin qilish
Saytda ro'yxatdan o'ting, keyin Supabase **SQL Editor** da (emailni o'zingiznikiga almashtiring):

```sql
update public.profiles set role = 'admin'
  where id = (select id from auth.users where email = 'SIZNING@EMAIL.uz');
```

Sahifani yangilang: menyuda **Admin** paydo bo'ladi. Endi kitob qo'shishingiz mumkin.

### 4. Internetga joylash (Vercel)
1. Repozitoriyni [vercel.com](https://vercel.com) ga ulang (Framework: Vite).
2. **Environment Variables** ga `VITE_SUPABASE_URL` va `VITE_SUPABASE_ANON_KEY` ni qo'shing.
3. Deploy. Sahifalar to'g'ri ochilishi uchun `vercel.json` allaqachon bor.
4. Supabase'dagi `Site URL` ni yangi manzilga almashtiring.

## Eslatmalar
- Supabase bepul tarifida bitta fayl hajmi 50 MB gacha. Kattaroq kitoblar uchun PDF'ni siqing yoki tarifni oshiring.
- Kutubxonaga faqat tarqatishga ruxsat berilgan kitoblarni qo'ying va har biriga litsenziya va manbani yozing.
- Skanerlangan (rasm ko'rinishidagi) PDF'larda kitob ichidan qidiruv ishlamaydi.

## Keyingi qadamlar
- Xatcho'p, matnni belgilash va izohlar
- Ovozli o'qish (TTS), lug'at / tarjima
- PWA: telefonga o'rnatish va oflayn o'qish
- Skanerlangan kitoblar uchun OCR
