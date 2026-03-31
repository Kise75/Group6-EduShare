# EduShare: A Smart Web-Based Marketplace for University Students to Exchange Textbooks and Learning Materials

EduShare is a student marketplace web application for buying, selling, lending, and giving away textbooks and study materials. This codebase keeps the original MERN-style architecture, then upgrades it into a stronger final academic project with recommendation logic, smart pricing, trust signals, meetup coordination, moderation workflows, and an admin dashboard.

## Why This Project Is Stronger Now

- Smart recommendation engine based on text relevance, course codes, browsing history, pricing, condition, distance, and freshness
- Smart price suggestion workflow on listing create/edit
- Trust and safety signals with seller trust scores and badges
- Wishlist, tracked course codes, and alert notifications
- Smart meetup planning with campus-safe locations and confirmation states
- Stronger moderation with report resolution, review moderation, listing visibility controls, and user suspension
- Better demo readiness with sample data, clearer architecture, and repeatable setup instructions

## Core Features

- Authentication: register, login, forgot password, token-based session bootstrap
- Marketplace: create, edit, browse, search, reserve, release, and sell listings
- Messaging: listing-based chat plus direct member/admin conversations
- Recommendations: home feed and related listings
- Pricing: suggested price range with explanation and evidence
- Trust: rating averages, completed transaction count, response speed, cancellation rate, badges
- Meetup: suggested safe campus locations, dual confirmation, complete/cancel flow
- Wishlist: save listings, follow course codes, receive alerts
- Notifications: message, reservation, meetup, review, wishlist, and listing status alerts
- Reviews: transaction-based reviews after completed meetups
- Admin moderation: role changes, ban/unban, hide/unhide listing, report workflow, review moderation

## Tech Stack

- Frontend: React, React Router, Axios, Vite, Bootstrap, Leaflet
- Backend: Node.js, Express, MongoDB, Mongoose
- Auth: JWT
- Media: Cloudinary fallback to local upload paths
- Testing: Node built-in test runner

## Architecture Summary

### Frontend

- `frontend/src/pages`: route-level pages
- `frontend/src/components`: reusable UI blocks such as navbar shell, listing card, notification bell, trust badges
- `frontend/src/context`: auth, theme, and language providers
- `frontend/src/services/api.js`: shared Axios client
- `frontend/src/utils`: formatting, locale, saved item helpers, Leaflet config

### Backend

- `backend/models`: MongoDB schemas
- `backend/controllers`: request handlers per domain
- `backend/routes`: Express route modules
- `backend/services`: business logic helpers for recommendations, pricing, trust, notifications, moderation-related rules
- `backend/middleware`: auth, admin gate, upload, and error helpers
- `backend/scripts/seed.js`: demo data reset script
- `backend/tests`: business logic regression tests

## Data Model Highlights

- `User`
  - profile fields, role, trust-related counters
  - tracked course codes and meetup preferences
  - moderation status with ban metadata
- `Listing`
  - lifecycle status: `Active`, `Reserved`, `Sold`
  - moderation visibility: `Visible`, `Hidden`
  - price history and preferred campus location
- `Meetup`
  - `Pending`, `Confirmed`, `Completed`, `Cancelled`
  - dual confirmation flags and suggested safe locations
- `Review`
  - tied to completed meetup
  - moderation status for publish/hide
- `Report`
  - listing/user report target
  - status, action taken, resolution note, resolver
- `Notification`
  - cross-feature alert center for all important user events

## Setup

### 1. Install dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2. Configure environment variables

Create `backend/.env` using `backend/.env.example` as a template.

Important variables:

- `PORT=5000`
- `MONGODB_URI=...`
- `JWT_SECRET=...`
- `FRONTEND_URL=http://127.0.0.1:5173`
- `EMAIL_USER=...`
- `EMAIL_PASS=...`
- `CLOUDINARY_NAME=...`
- `CLOUDINARY_API_KEY=...`
- `CLOUDINARY_API_SECRET=...`

If Cloudinary is missing, listing images still work through local upload paths.

### 3. Optional: reset demo data

```bash
cd backend
npm run seed
```

This wipes old demo data and recreates a presentation-ready dataset.

### 4. Run the app

Backend:

```bash
cd backend
npm run dev
```

Frontend:

```bash
cd frontend
npm run dev
```

Default local URLs:

- Frontend: `http://127.0.0.1:5173`
- Backend: `http://127.0.0.1:5000`

## Demo Accounts

After running the seed script:

- `admin` / `123456`
- `phuong@edushare.dev` / `123456`
- `minh@edushare.dev` / `123456`
- `linh@edushare.dev` / `123456`

## Admin Moderation Workflow

The upgraded admin dashboard now supports:

- promote/demote roles
- ban/unban users
- auto-hide a banned seller's marketplace listings
- hide/unhide listings manually
- resolve reports with explicit actions
- dismiss reports with a note
- hide/restore reviews without deleting data

This makes the project feel closer to a real marketplace instead of a basic CRUD demo.

## Key Product Logic Worth Mentioning

### Recommendation scoring

Recommendation score uses:

- keyword relevance
- course code match
- recent browsing similarity
- listing condition
- price attractiveness
- campus distance
- freshness

### Price suggestion logic

Price suggestion uses:

- course code similarity
- title overlap
- category similarity
- edition similarity
- condition matching
- sold-item evidence
- outlier removal plus median-based range generation

### Trust score logic

Trust score combines:

- average rating
- completed transactions
- response speed
- email verification
- cancellation penalty

## Quality and Safety Improvements

- Hidden listings are removed from public browsing, search, recommendation, and wishlist feeds
- Banned users cannot authenticate into protected flows
- Hidden listings cannot be reserved
- Duplicate open reports on the same target are blocked
- Users cannot report their own listing or account
- Reviews only affect rating averages when they are published
- Reserved status is kept behind the reservation workflow instead of arbitrary form editing

## Tests

Backend business tests:

```bash
cd backend
npm test
```

Frontend production build:

```bash
cd frontend
npm run build
```

## Suggested Demo Flow

1. Show homepage recommendations and explain the scoring formula.
2. Open a listing and show trust score, badges, reserve action, report action, and related items.
3. Create or edit a listing and show smart price suggestion.
4. Open messages and demonstrate buyer-seller or user-admin chat.
5. Open meetup planner and show map, suggested safe points, and confirmation state.
6. Open wishlist and tracked course code alerts.
7. Open transaction history and show review eligibility.
8. Open admin moderation hub and demonstrate:
   - ban/unban
   - hide/unhide listing
   - resolve report
   - hide/restore review

## Lecturer-Facing Talking Points

- This is not just a CRUD marketplace; it includes recommendation, moderation, safety, trust, and decision-support logic.
- The system models realistic marketplace lifecycle states such as reservation, meetup confirmation, completion, and post-transaction review.
- Admin tooling is treated as a first-class subsystem, not an afterthought.
- The project balances product design and backend logic, which is closer to real software engineering practice.
- Safety and moderation rules were added to reduce abuse and invalid state transitions.

## Repository Notes

- Root GitHub repo: `https://github.com/Kise75/Group6-EduShare`
- `node_modules`, build output, and local secrets are excluded by `.gitignore`
- Current branch: `main`
- Requirement summary for three core scenarios: `PROJECT_FEATURE_SUMMARY.md`

## Submission Checklist

- [x] Auth flow
- [x] Marketplace flow
- [x] Search and filters
- [x] Smart recommendation
- [x] Smart pricing
- [x] Messaging
- [x] Meetup planner with real map
- [x] Wishlist and alerts
- [x] Reviews
- [x] Admin moderation
- [x] Demo seed data
- [x] Tests and build commands
- [x] Presentation-ready README
