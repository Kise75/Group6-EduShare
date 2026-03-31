# EduShare Feature Summary

This file summarizes three core project scenarios in the format requested by the course requirements.

## 1. Student Authentication and Account Access

Purpose:
Allow students to create an account, sign in securely, recover access if they forget their password, and keep their own account data separate from other users.

What it does:
The system supports registration, login, session bootstrap with JWT, forgot-password email flow, and reset-password completion.

How users use it:
Users open the authentication screen, submit the required form, and then access protected pages such as profile, messages, meetups, and listing management.

What users can expect:
They receive validation feedback for missing or mismatched input, keep their own session state, and can return later to continue using their existing account information.

## 2. Marketplace Listing and Search Workflow

Purpose:
Help students post textbooks or study materials and help other students find items quickly through search, filters, sorting, and detailed listing pages.

What it does:
Users can create, edit, browse, reserve, release, and manage listings. Search supports filters such as category, condition, price, location, and sorting, while listing pages show seller details, trust signals, and actions.

How users use it:
Sellers fill out the listing form with title, description, price, condition, and meetup preferences. Buyers browse the home page or search page, filter results, open a listing, and reserve the item when interested.

What users can expect:
They get responsive pages, client-side and server-side validation, persistent listing data in MongoDB, and marketplace results that update based on current application state.

## 3. Messaging, Meetup, and Post-Transaction Review

Purpose:
Support safe communication and item exchange between students from first contact to completed handoff.

What it does:
The application provides in-app messaging, a campus meetup planner with suggested safe locations and map interaction, transaction tracking, and review submission after completion.

How users use it:
After finding a listing, a buyer can message the seller, propose a meetup location/date/time, confirm or complete the meetup, and then leave a rating and review from transaction history.

What users can expect:
They can coordinate the exchange inside one system, see safer meetup suggestions, keep a record of completed transactions, and provide feedback after the item is received.
