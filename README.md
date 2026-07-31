# Student Crib — Phase 1: Auth

This phase gets real Google sign-in, role/university selection, domain
validation, and profile completion working end to end against Firebase.
Everything past the "You're signed in" placeholder screen is Phase 2+.

## What's in this phase

- Google-only sign-in (no email/password option, by design)
- Role picker: Student / Agent / Landlord
- University picker (10 Zimbabwean universities pre-loaded — see the
  warning in `src/data/universities.ts` about verifying domains)
- Email domain enforcement: students/agents must match their university's
  domain, landlords can use any email
- Profile completion: name, Zimbabwean phone number format, profile photo
  upload to Firebase Storage
- Firestore + Storage security rules scoped to what this phase touches

## 1. Create the Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) → **Add project**.
2. Once created, click the **web icon (`</>`)** on the project overview page to register a web app. Name it anything (e.g. "student-crib-web").
3. Copy the `firebaseConfig` values shown — you'll paste these into `.env.local` in step 4.

## 2. Turn on the products this phase needs

In the left sidebar:

- **Authentication** → Get started → Sign-in method → enable **Google**. Set a support email when prompted.
- **Firestore Database** → Create database → start in **production mode** (the rules file in this repo handles access, not the "test mode" defaults).
- **Storage** → Get started → production mode.

## 3. Configure the Google OAuth consent screen

Firebase creates this for you automatically in most cases, but if Google
sign-in errors out on first use:

1. Go to [console.cloud.google.com](https://console.cloud.google.com), select the same project.
2. **APIs & Services → OAuth consent screen** → fill in app name, support email, and (once you have one) your production domain.
3. **APIs & Services → Credentials** → under OAuth 2.0 Client IDs, make sure your Vercel/Netlify domain is added to **Authorized JavaScript origins** and **Authorized redirect URIs** once you deploy (localhost is allowed by default for `npm run dev`).

## 4. Set your environment variables

```bash
cp .env.example .env.local
```

Paste in the six values from step 1. `.env.local` is already git-ignored —
never commit real Firebase keys to a public repo (the API key itself is
not secret since Firebase enforces access via the rules files, but keep the
habit).

## 5. Install and run locally

```bash
npm install
npm run dev
```

Open the printed localhost URL on your phone (same wifi network) or in a
desktop browser to test the full flow: Google sign-in → role/university →
domain check → profile completion → placeholder home screen.

## 6. Deploy the security rules

Install the Firebase CLI once, globally:

```bash
npm install -g firebase-tools
firebase login
firebase init firestore storage   # point it at firestore.rules and storage.rules already in this repo
firebase deploy --only firestore:rules,storage:rules
```

Until you run this, your Firestore/Storage will use whatever default rules
you picked in step 2 — production mode defaults to fully locked down, which
will make sign-up fail with a permissions error. Deploying `firestore.rules`
and `storage.rules` from this repo is what actually opens the specific,
narrow access this phase needs.

## 7. Deploy the app (Vercel or Netlify)

Either platform: connect your GitHub repo, framework preset "Vite", and add
the same six `VITE_FIREBASE_*` variables from `.env.local` as environment
variables in the platform's dashboard. Then repeat step 3's origin/redirect
URI setup with your real `*.vercel.app` or `*.netlify.app` domain (or custom
domain once you have one).

## Testing checklist before moving to Phase 2

- [ ] Sign in with a `@hit.ac.zw` Google account as Student → succeeds
- [ ] Sign in with a non-university Google account as Student → blocked with a clear error
- [ ] Sign in with any Google account as Landlord → succeeds regardless of domain
- [ ] Phone field rejects anything not matching `+263 71X XXX XXX`
- [ ] Profile photo over 5MB is rejected client-side
- [ ] Refreshing the page after completing profile skips straight to the home placeholder (session persists)
- [ ] Signing out returns to the Welcome screen

## What's next (Phase 2)

Firestore schema for listings/inquiries/marketplace, the full security
rules for those collections, TypeScript types, and a seed script for the
sample Hatcliffe/Borrowdale/Glen Lorne listings from the prototype.
