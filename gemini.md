# Project: Gekko - Developer Home Base

## 1. Project Overview
Gekko is a full-stack, agile task management application (Kanban board) built specifically for software engineering teams. The Minimum Viable Product (MVP) has been successfully completed, featuring secure authentication, relational data models, drag-and-drop interactions, and third-party API integrations.

## 2. Tech Stack
* **Framework:** Next.js (App Router, v16.2.6 with Turbopack)
* **Language:** TypeScript
* **Styling:** Tailwind CSS
* **Backend/Database:** Supabase (PostgreSQL, Auth, PostgREST API)
* **Markdown Parsing:** `react-markdown`

## 3. Current Architecture & State
The application heavily utilizes Next.js Client Components (`"use client"`) for interactivity, routing, and real-time state management. Data fetching is currently handled on the client side via the `@supabase/supabase-js` client.

### Core Features Implemented:
* **Authentication:** Handled via Supabase Auth. A Postgres trigger automatically replicates users from `auth.users` to the public `profiles` table.
* **Kanban Board (`/tickets`):** * Features HTML5 drag-and-drop.
  * Instant, optimistic UI updates synced with Supabase.
  * Advanced client-side filtering by Type and Priority.
* **Ticket Detail Engine:**
  * Modal-based ticket viewing.
  * Markdown-supported ticket descriptions and relational comment threads.
* **Sprint Planning (`/sprints` & `/calendar`):** * Sprint creation and timeline visualization with date-math logic.
* **Team Management (`/team`):** * Roster view and ticket assignment via explicit foreign keys.
* **Dashboard (`/`):** * Aggregated ticket metrics and live GitHub API fetching for Open PR counts.

## 4. PostgreSQL Database Schema
All tables are protected by Row Level Security (RLS) policies. 
*Ensure explicit foreign key hinting is used in Supabase queries if PostgREST cache issues arise (e.g., `profiles!author_id(...)`).*

**Table: `profiles`**
* `id` (UUID, Primary Key, maps to auth.users)
* `email` (Text)
* `full_name` (Text, nullable)
* `avatar_url` (Text, nullable)
* `created_at` (Timestamptz)

**Table: `sprints`**
* `id` (BigInt, Identity PK)
* `name` (Text)
* `goal` (Text, nullable)
* `start_date` (Date)
* `end_date` (Date)

**Table: `tickets`**
* `id` (BigInt, Identity PK)
* `title` (Text)
* `description` (Text, nullable, supports Markdown)
* `type` (Text: Bug, Feature, Task, Question)
* `priority` (Text: Critical, High, Medium, Low)
* `status` (Text: Open, In Progress, Review, Closed)
* `is_blocked` (Boolean, default false)
* `assignee_id` (UUID, FK -> profiles.id, nullable)
* `created_at` (Timestamptz)

**Table: `comments`**
* `id` (BigInt, Identity PK)
* `ticket_id` (BigInt, FK -> tickets.id, ON DELETE CASCADE)
* `author_id` (UUID, FK -> profiles.id, ON DELETE CASCADE)
* `content` (Text, supports Markdown)
* `created_at` (Timestamptz)

## 5. Coding Guidelines & AI Instructions
* **Component Preference:** Prefer functional React components with hooks (`useState`, `useEffect`).
* **Supabase Syntax:** Always handle errors gracefully with `try...catch` blocks for external APIs (like GitHub) and standard `{ data, error }` destructuring for Supabase. 
* **State Management:** Use optimistic UI updates for database mutations (update the local state immediately, revert if the database query fails).
* **Styling:** Use Tailwind utility classes. Avoid custom CSS files unless absolutely necessary.
* **UI/UX:** Maintain a clean, developer-focused aesthetic using gray, emerald, and slate tones. Avoid unnecessary animations; prioritize speed and data density.

## 6. Next Steps / Current Roadmap
The MVP is complete. Choose from one of the following phases when prompting for new work:
1. **Architecture Polish:** Implement Loading Skeletons for the dashboard and a debounced Search Bar for the Kanban board.
2. **UI Polish (Cosmetics):** Implement `react-hot-toast` for success/error notifications and wire up a Global Dark Mode.
3. **Advanced Integrations:** Allow attaching specific GitHub PR URLs directly to tickets.