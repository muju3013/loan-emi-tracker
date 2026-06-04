# Personal Loan & EMI Tracker

Track loans, EMIs, and payments with **Firebase Authentication** and **Cloud Firestore**.

## Features

- Email/password **sign up**, **login**, **logout**
- Add / edit / delete loans (saved to Firestore per user)
- EMI schedule, mark paid, upcoming reminders
- **Total outstanding** amount on dashboard
- Each user only sees their own data (Firestore security rules)

## Firebase setup

See **[FIREBASE_SETUP.md](./FIREBASE_SETUP.md)** for full steps.

**Paste your config in `src/firebase.js`** inside the `firebaseConfig` object, or use a `.env` file (copy from `.env.example`).

## Run locally

```bash
npm install
npm run dev
```

Enable **Email/Password** in Firebase Console → Authentication.

Create a **Firestore** database and deploy rules from `firestore.rules`.

## Tech stack

- React 19 + TypeScript + Vite
- Firebase v11 modular SDK (`firebase/auth`, `firebase/firestore`)
- Tailwind CSS 4

## Project structure

| File | Purpose |
|------|---------|
| `index.html` | App entry |
| `src/index.css` | Styles |
| `src/firebase.js` | **Firebase config — paste here** |
| `src/main.tsx` | Bootstrap |
| `src/App.tsx` | Routes |
| `src/hooks/useAuth.tsx` | Auth state |
| `src/hooks/useAppStore.tsx` | Loans + Firestore sync |
| `src/services/firestoreService.ts` | Firestore CRUD |
