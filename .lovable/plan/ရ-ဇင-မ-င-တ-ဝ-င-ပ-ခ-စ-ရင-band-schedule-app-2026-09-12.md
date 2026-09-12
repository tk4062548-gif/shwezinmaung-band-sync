# ရွှေဇင်မောင် တီးဝိုင်းပွဲချီစာရင်း — Band Schedule App

A mobile-first, installable app for the band leader to manage shows and for members to view them.

## What you get

**Home screen (phone-first cards)**
- Search bar: type an event name, place, or date and the list filters instantly
- Three sections: Today, Upcoming, Past
- Toggle between List view and Calendar (month grid with dots on show days)
- "Add new event" button, visible to the leader only
- A small bell mark on events happening tomorrow

**Event details**
- Title, date and time, place/address, notes
- Extra reminder times can be added per event
- Leader can edit, delete, or tick an event as finished

**Accounts**
- Sign in with email and password
- Leader (admin): add, edit, delete, mark finished
- Members (viewer): view, search, reminders — no editing
- First account can be promoted to leader; others default to viewer

**Language**
- Whole interface in Myanmar Unicode or English, switched in Settings; choice is remembered

**Sync**
- Events live in the cloud, so everyone sees the same list whenever they open the app online, updating live

**Installable on Android**
- App name, icon and colours so it can be added to the home screen and open full screen (no offline mode in this version)

**Look**
- Warm gold on dark stage tones, rounded cards, a generated band illustration in the hero and app icon

## Technical notes

- Lovable Cloud enabled; `events` table (title, starts_at, location, notes, completed, created_by) with grants + RLS: all signed-in users read; only admins insert/update/delete. `event_reminders` table for extra reminders. Roles in a separate `user_roles` table with a `has_role` security-definer function — never on profiles.
- Realtime subscription on `events` invalidates the TanStack Query cache.
- Routes: `/` public landing + sign-in CTA, `/auth`, `_authenticated/dashboard` (list/calendar), `_authenticated/events/$id`, `_authenticated/settings`.
- Language via a small i18n context + localStorage; all strings in one dictionary file.
- Manifest-only PWA (manifest + icons + head tags), no service worker.
- Reminders are in-app indicators (1 day before + extra times). Push notifications when the app is closed are not part of this version.

## Open question

Notifications while the app is closed would need a separate push setup — say the word and I add it later.
