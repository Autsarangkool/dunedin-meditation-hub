# Dunedin Meditation Hub

## Project Overview

Meditation Check-in & Member Database System for Dunedin Meditation Hub.

---

## Technology Stack

- Next.js 15
- TypeScript
- Tailwind CSS
- Supabase
- Vercel

---

## Database Tables

### members

Stores member information.

Fields:

- id
- full_name
- nickname
- phone
- email
- profile_photo_url
- created_at

### checkins

Stores attendance records.

Fields:

- id
- member_id
- session_id
- checkin_date
- created_at

### sessions

Stores meditation sessions.

Fields:

- id
- title
- event_date
- created_at

---

## Features Completed

### Authentication

- Admin Login
- Supabase Authentication
- Session Protection

### Dashboard

- Total Members
- Total Check-ins
- Monthly Check-ins
- Today's Check-ins
- Total Sessions
- Most Active Member
- Top Active Members

### Members

- Member List
- Search Members
- Member Detail
- Edit Member
- Member Photo

### Attendance

- QR Check-in
- Manual Check-in
- Attendance Report

### Import / Export

- Import Excel
- Export Excel
- Export Members PDF

---

## Current Statistics

- Members: 119
- Sessions: 19
- Check-ins: 332+

---

## Next Features

### Reports

- Attendance Report PDF
- Session Summary PDF

### Member Management

- Member Card PDF
- QR Membership Card

### Dashboard

- Attendance Charts
- Monthly Analytics

---

## Deployment

Frontend:
- Vercel

Backend:
- Supabase

Project Name:
- Dunedin Meditation Hub