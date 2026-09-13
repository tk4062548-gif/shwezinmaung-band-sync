# Shwe Zin Maung Schedule

Create a mobile-first web app (PWA) named "ရွှေဇင်မောင် တီးဝိုင်းပွဲချီစာရင်း" (Shwe Zin Maung Band show/work schedule manager), designed for Android phones. Build the first version with: (1) Event model with add/edit/delete and mark-as-completed; (2) Authentication with an Admin role (band leader: can add, edit, delete, complete events) and Viewer role (band members: read-only, view, search, reminders); (3) Calendar View and List View toggles; (4) Real-time search by event name, location, or date; (5) Add New Event form with event title, date & time picker, location/address, notes/details, and optional extra reminders; (6) Separate Upcoming Events / Today's Events / Past Events sections on the main screen with Search Bar, Add New Event button, and Calendar; (7) Bilingual UI (Myanmar Unicode and English) with an easy language switch in Settings; (8) Store data in a cloud database (enable Lovable Cloud) so updates sync to all users in real time when they open the app online; (9) Reminder indicator for events 1 day before, with support for adding extra reminders; (10) Modern, simple, easy-to-use design with a band/music theme (band illustration in the hero/app icon, warm golden/dark stage aesthetic, card-based mobile layout).

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://shwezinmaung-band-sync.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/71bf17c3-fa95-43b0-bf8c-fe646cff3db9).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
