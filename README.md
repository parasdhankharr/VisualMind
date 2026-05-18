# Visual Learning Platform

A premium full-stack ed-tech app built with Next.js App Router, Tailwind CSS, Framer Motion, MongoDB, Mongoose, and Supabase Auth.

## Features

- Animated storytelling landing page
- Signup and login with Supabase email/password auth
- MongoDB models for users, courses, progress, and quiz attempts
- Dashboard with course cards, XP, streaks, badges, progress, and leaderboard
- Course player with visual lesson panel, progress bar, next/previous controls, mark complete, and quiz feedback
- AI content transform demo API that converts long text into summary bullets, simplified explanation, and infographic blocks
- Dark/light mode toggle, glassmorphism UI, skeleton loaders, responsive layouts, and Framer Motion transitions

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create environment variables:

   ```bash
   cp .env.example .env.local
   ```

3. Add your Supabase project URL and publishable key to `.env.local`.

4. Start MongoDB locally or replace `MONGODB_URI` with a MongoDB Atlas connection string.

5. Run the app:

   ```bash
   npm run dev
   ```

6. Open `http://localhost:3000`.

The app includes fallback dummy data, so the UI works even before you seed MongoDB.
