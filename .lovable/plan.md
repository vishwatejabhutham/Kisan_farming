# Admin Dashboard Plan

A protected `/admin` section, accessible only to users with the `admin` role, focused on user & role management plus platform user counts (farmers vs consumers).

## Access control

- Reuse existing `user_roles` table + `has_role()` security-definer function.
- Extend the `app_role` enum to include `farmer` and `consumer` (keep existing `admin`, `user`).
- Add an `AdminRoute` guard component: checks `auth.uid()` → calls `has_role(uid, 'admin')` → redirects non-admins to `/`.
- One trusted admin must be seeded manually (I'll insert one row into `user_roles` after you tell me which email).

## Schema changes (single migration)

- `ALTER TYPE app_role ADD VALUE 'farmer'; ADD VALUE 'consumer';`
- Add `profiles.user_type` optional column (`'farmer' | 'consumer' | null`) so we can classify signups. Default `null`; admins can set it, users can set their own on signup later.
- RLS on `user_roles`: allow admins to `SELECT` all rows and `INSERT`/`DELETE` roles (currently only self-select). Add policies using `has_role(auth.uid(), 'admin')`.
- RLS on `profiles`: allow admins `SELECT` all.
- No changes to disease_reports / alerts / inventory (out of scope per your answers).

## Routes & layout

```text
/admin                → Overview (farmer & consumer counts, total users, recent signups)
/admin/users          → Users table: email, joined, role(s), user_type, actions
/admin/roles          → Role assignments: promote/demote admin, set farmer/consumer
```

- New `src/pages/admin/AdminLayout.tsx` using shadcn Sidebar (collapsible icon variant) + existing Navbar hidden or replaced with admin header.
- Sidebar items: Overview, Users, Roles. Active-route highlighting via `NavLink`.
- Wrap all admin routes in `<AdminRoute>` inside `App.tsx`.

## Pages

### Overview (`/admin`)
Two KPI cards + small recent-signups list:
- **Active farmers** — `count(user_roles where role='farmer')`
- **Active consumers** — `count(user_roles where role='consumer')`
- Total users, admins count, last 10 signups (from `profiles` ordered by `created_at`).

Uses `useQuery` against Supabase; realtime subscription on `user_roles` to auto-refresh counts.

### Users (`/admin/users`)
Table (shadcn Table) joining `profiles` + `user_roles`:
- Columns: Email/display name, Joined, Type (farmer/consumer/—), Roles (chips), Actions
- Search box (client-side filter), pagination (25 per page).

### Roles (`/admin/roles`)
Per-user controls:
- Toggle admin (insert/delete `user_roles` row where `role='admin'`).
- Set user_type via dropdown (farmer / consumer / none) — updates `profiles.user_type`.
- Confirmation dialogs before revoking admin or changing type.
- Toast on success/failure.

## Design

Match existing light editorial theme: `glass-card`, `pill-tab`, `font-heading`, dark-green accent. Sidebar uses same tokens (no purple/generic AI look). No new fonts.

## Files to create

- `src/components/AdminRoute.tsx`
- `src/components/admin/AdminSidebar.tsx`
- `src/pages/admin/AdminLayout.tsx`
- `src/pages/admin/Overview.tsx`
- `src/pages/admin/Users.tsx`
- `src/pages/admin/Roles.tsx`

## Files to edit

- `src/App.tsx` — add nested admin routes wrapped by `AdminRoute`.
- `src/components/dashboard/Navbar.tsx` — show "Admin" link in user menu when `has_role(admin)`.

## Out of scope (per your answers)

- No CRUD on disease_reports, alerts, inventory.
- No admin analytics beyond farmer/consumer counts.

## One thing I need from you before building

Which email address should I seed as the first admin? (Must be an already-signed-up account.)