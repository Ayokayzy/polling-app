# Polling App

A modern web application that allows users to create, share, and vote on polls with QR code sharing functionality.

## Features

### 🗳️ Poll Management
- Create polls with multiple options
- Edit existing polls (creator only)
- Delete polls (creator only)
- View detailed poll statistics

### 📊 Voting System
- One vote per user per poll
- Real-time vote counting with optimistic updates
- Visual progress bars showing vote distribution
- Vote validation and error handling

### 🔗 Poll Sharing
- Unique shareable URLs for each poll
- QR code generation for mobile access
- Native web share API integration
- Copy-to-clipboard functionality

### 👤 User Authentication
- Secure user registration and login via Supabase
- Protected routes and poll ownership
- User-specific voting tracking

### 🎨 Modern UI/UX
- Responsive design with Tailwind CSS
- shadcn/ui components for consistent styling
- Loading states and skeleton screens
- Toast notifications for user feedback
- Optimistic updates for smooth interactions

## Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase with Prisma ORM
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS with shadcn/ui components
- **Language**: TypeScript
- **QR Codes**: qrcode library

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome\!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.