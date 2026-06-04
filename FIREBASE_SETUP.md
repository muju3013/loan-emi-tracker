# Firebase setup — Loan EMI Tracker

## 1. Where to paste `firebaseConfig`

**Option A — `src/firebase.js` (recommended for quick start)**

Open `src/firebase.js` and replace the placeholder strings in `firebaseConfig`:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123",
};
```

Get these values from: **Firebase Console → Project settings (gear) → Your apps → Web app → `firebaseConfig`**

**Option B — `.env` file (recommended for production)**

1. Copy `.env.example` to `.env` in the project root (`d:\Loan\.env`)
2. Paste each value from Firebase Console into the matching variable
3. Restart `npm run dev`

---

## 2. Enable Authentication

Firebase Console → **Build → Authentication → Sign-in method**

- Enable **Email/Password**

---

## 3. Create Firestore database

Firebase Console → **Build → Firestore Database → Create database**

- Start in **test mode** for development, then deploy rules below

---

## 4. Deploy security rules

Copy `firestore.rules` from this project into:

**Firebase Console → Firestore → Rules → Publish**

Or with Firebase CLI:

```bash
firebase deploy --only firestore:rules
```

Rules ensure each user only reads/writes under `users/{theirUid}/...`.

---

## 5. Data structure (per user)

```
users/{userId}/loans/{loanId}     ← loan documents
users/{userId}/emis/{emiId}       ← EMI schedule (filtered by userId in rules)
users/{userId}/settings/app       ← holidays list
users/{userId}/profile/main       ← name, email on signup
```

---

## 6. Run the app

```bash
npm install
npm run dev
```

Open http://localhost:5173 → Sign up → Add loans (saved to Firestore).

---

## Project files (React + Vite)

| File | Role |
|------|------|
| `index.html` | App entry HTML |
| `src/index.css` | Global styles (Tailwind) |
| `src/firebase.js` | **Paste config here** |
| `src/main.tsx` | React bootstrap |
| `src/App.tsx` | Routes |
| `src/hooks/useAuth.tsx` | Login / signup / logout |
| `src/hooks/useAppStore.tsx` | Loans + Firestore sync |
| `src/services/firestoreService.ts` | Firestore CRUD |
| `src/pages/AuthPage.tsx` | Login & signup UI |

This is a **React** app (not separate HTML/JS files). All UI lives in `src/pages` and `src/components`.
