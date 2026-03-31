# NotebookLM Slide Source

## Project Title

EduShare: A Smart Web-Based Marketplace for University Students to Exchange Textbooks and Learning Materials

## Presenter Information

- Group: Group 6
- Member: Mai Tan Phat
- Student ID: [Fill in your student ID]
- Course: New Programming Language
- Submission date: March 31, 2026

## Project Overview

EduShare is a web application that helps university students buy, sell, lend, and give away textbooks and learning materials. The system was built to solve a common problem on campus: students often need a simple and trusted way to exchange study materials without relying on scattered Facebook posts or personal messages.

The platform supports the full workflow from browsing and posting listings to messaging, meetup planning, and post-transaction reviews. In addition to the basic marketplace flow, the project also includes recommendation logic, smart pricing, trust signals, notifications, wishlist tracking, and admin moderation.

## Problem Statement

- Students often struggle to find affordable used textbooks and learning materials.
- Existing exchange methods in social media groups are hard to search and manage.
- Buyers and sellers need a safer and more organized way to communicate and meet.
- Basic marketplace websites do not always address student-specific needs such as course codes, campus meetup locations, and trust between users.

## Project Objectives

- Build a web-based marketplace for student learning materials.
- Support registration, login, and profile management.
- Allow users to create, search, edit, reserve, and manage listings.
- Provide messaging and meetup planning inside the system.
- Improve trust with reviews, badges, and moderation tools.
- Add recommendation and price suggestion features to improve usability.

## Target Users

- Guest: browse listings and search the marketplace.
- Registered user: create listings, reserve items, send messages, plan meetups, save items, receive notifications, and write reviews.
- Admin: manage users, listings, reports, and reviews.

## Core Features

- Authentication with register, login, forgot password, and reset password.
- Listing CRUD with images, item details, and reservation state.
- Search and filtering by keyword, category, condition, price, and location.
- Listing-based messaging between buyer and seller.
- Meetup planner with suggested safe campus locations.
- Reviews and trust score after completed transactions.
- Wishlist, tracked course codes, and notifications.
- Admin moderation dashboard.

## Smart Features

### Recommendation System

The recommendation module ranks listings using keyword relevance, course code matching, browsing similarity, condition, price attractiveness, distance, and freshness.

### Smart Price Suggestion

The price suggestion module compares the draft listing with similar items, removes outliers, and suggests a price range based on median values and item condition.

### Trust and Safety

The trust profile uses average rating, completed transactions, response speed, email verification, and cancellation rate. The system also supports reports, review moderation, and user suspension.

## System Architecture

- Frontend: React, React Router, Axios, Bootstrap, Leaflet
- Backend: Node.js, Express.js
- Database: MongoDB with Mongoose
- Auth: JWT
- Media: Cloudinary or local upload fallback

The frontend communicates with the backend through RESTful APIs. The backend handles business logic, stores data in MongoDB, and manages authentication, moderation, recommendation, pricing, and notifications.

## Main Database Collections

- User
- Listing
- Message
- Meetup
- Review
- Report
- Notification

## Testing Summary

- Backend automated tests: 11 passed, 0 failed
- Frontend production build: successful
- Important tested areas: reservation workflow, hidden listing protection, pricing logic, recommendation logic, search normalization, typo handling, notification payload structure

## Deployment and Repository

- GitHub repository: https://github.com/Kise75/Group6-EduShare
- Local frontend URL: http://127.0.0.1:5173
- Local backend URL: http://127.0.0.1:5000
- Demo method at submission time: run locally using the README instructions
- Frontend local URL: http://127.0.0.1:5173
- Backend local URL: http://127.0.0.1:5000

## Demo Flow Suggestion

1. Show the homepage and explain the project problem.
2. Search for a listing and apply filters.
3. Open a listing detail page and explain trust information.
4. Create or edit a listing and show the smart price suggestion.
5. Show messaging between users.
6. Show the meetup planner with campus-safe location suggestions.
7. Show transaction history and review flow.
8. Open the admin dashboard and explain moderation functions.

## Conclusion

EduShare is more than a simple CRUD marketplace. It combines marketplace management, recommendation logic, trust features, and moderation tools into one student-focused system. The project solves a practical campus problem and shows both frontend and backend development skills.

## Screenshot Suggestions for Slides

- Homepage
- Search page
- Listing detail page
- Listing form with price suggestion
- Messages page
- Meetup page with map
- Admin dashboard
