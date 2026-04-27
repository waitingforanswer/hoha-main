# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Gia Phả Dòng Họ Hà Quang** — A Vietnamese family genealogy and heritage management system. It has two interfaces: a public-facing site for family members to browse the tree and posts, and a protected admin panel for managing content and configuration.

## Commands

```bash
npm run dev       # Start dev server at http://localhost:8080
npm run build     # Production build to dist/
npm run lint      # Run ESLint
npm run preview   # Serve production build locally
```

There is no test framework configured in this project.

## Architecture

**Stack:** React 18 + TypeScript, Vite, Tailwind CSS + shadcn/ui, React Router v6, TanStack Query, Supabase (auth + database + edge functions).

### Dual Authentication System

The app has two separate auth flows that coexist:

1. **App User Auth** (`useAppAuth`) — Custom username/password auth for regular family members. Calls the `custom-auth` Supabase Edge Function; stores token in `localStorage` as `app_auth_session`. Access is gated by permission codes checked via `usePermissions`.

2. **Admin Auth** (`useAdminAuth`) — Merges Supabase email/password auth (`useAuth`) with the app user system. Full admins use Supabase Auth; sub-admins also authenticate via the Edge Function path. Admin session stored as `admin_app_user` and `admin_app_permissions` in `localStorage`.

Route protection components: `ProtectedRoute`, `AppProtectedRoute`, `PermissionProtectedRoute` (for public app users), and `AdminProtectedRoute` (for admin panel).

### Data Flow

```
React (TanStack Query) → Supabase JS Client → Supabase Edge Functions or direct table queries → PostgreSQL
```

Edge Functions in `supabase/functions/` handle: custom auth, permission fetching, and family member CRUD. Most other data (posts, feedback, settings) is queried directly via the Supabase client.

### Route Structure

- `/` `/gioi-thieu` `/bai-viet` `/bai-viet/:id` `/login` `/auth` — Public, no auth needed
- `/cay-gia-pha` `/thanh-vien/:id` — Requires app user login + specific permission codes
- `/admin/*` — Requires admin auth; some sub-routes require full admin (not sub-admin)

### Key Source Locations

| Concern | Location |
|---|---|
| Root routing + providers | `src/App.tsx` |
| Auth hooks | `src/hooks/useAuth.tsx`, `useAppAuth.tsx`, `useAdminAuth.tsx` |
| Permission logic | `src/hooks/usePermissions.tsx` |
| Admin layout | `src/components/admin/AdminLayout.tsx` |
| Public layout | `src/components/layout/MainLayout.tsx` |
| Supabase client | `src/integrations/supabase/client.ts` |
| DB types | `src/integrations/supabase/types.ts` |
| Edge Functions | `supabase/functions/` |
| DB migrations | `supabase/migrations/` |

### Path Alias

`@/*` maps to `src/*` (configured in `tsconfig.json` and `vite.config.ts`).

## Environment Variables

```
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

These are public/publishable keys safe for the frontend. Set them in `.env`.
