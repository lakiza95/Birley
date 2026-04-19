# Birley - B2B SaaS Platform for Educational Recruiting

Birley is a comprehensive B2B SaaS platform designed to streamline the interaction between educational institutions (Schools/Universities), recruitment agencies (Partners/Recruiters), and students. The platform manages the entire lifecycle of student recruitment, application processing, and financial settlements.

## 🚀 Tech Stack

- **Frontend:** React 18 (Vite), TypeScript, Tailwind CSS, Framer Motion (for animations).
- **Backend/Database:** Supabase (PostgreSQL, Authentication, Real-time, Storage, Edge Functions).
- **Icons:** Lucide React.
- **Charts:** Recharts / Custom D3 integration.

---

## 👥 Roles & Permissions (RBAC)

The platform implements a strict Role-Based Access Control model via Supabase RLS (Row Level Security):

### 1. Admin (Indigo)
- Full control over the platform.
- Approves/rejects recruitment agencies and educational institutions.
- Manages financial payouts and refund requests.
- Configures program commissions and system-wide settings.
- Direct support via Chat and Tickets.

### 2. Institution (Emerald)
- Manages institution profiles and educational programs.
- Reviews and processes student applications.
- Configures payment models (Full Upfront / Split Payment).
- Communicates directly with recruiters regarding specific applications.

### 3. Recruiter / Partner (Blue)
- Manages a pool of students (CRM functionality).
- Submits applications to various programs on behalf of students.
- Tracks application statuses through a Kanban-style dashboard.
- Manages commissions and withdrawal requests.
- Initiates refund requests for cancelled paid applications.

---

## 🛠 Core Modules & Features

### 1. Application Management System
- **Multi-step Workflow:** From "New application" to "Visa Approved" and "Done".
- **Kanban Board:** Specialized boards for both students and applications with drag-and-drop capability (restricted by automated status rules).
- **Document Tracking:** Upload and management of Passport, Visa, Education certificates, etc.
- **Refund Policy:** Dedicated logic for cancelling applications:
    - **Unpaid:** Direct cancellation with confirmation.
    - **Paid:** Initiation of a **Refund Request** with mandatory reason, requiring Admin approval.

### 2. Financial System
- **Commission Management:** Calculation based on `tuition_fee` and set `commission_rate`.
- **Withdrawals:** Recruiters can request payouts from their available balance.
- **Refund System:** Integrated workflow for handling student refunds through secondary moderation by admins.
- **Payment Models:** Support for different school billing models (Split payments, deadlines, etc.).

### 3. Communication Hub
- **Application Chats:** Context-aware chats for every student application between Recruiter and Institution.
- **Support Tickets:** Structured support system (Zendesk-style) for communicating with platform admins.
- **Real-time Notifications:** Database-driven alerts for status changes and new messages.

### 4. Marketplace & Matching
- **Program Database:** Searchable catalog of educational programs with filters for level, country, budget, and specialization.
- **Program Matcher:** intelligent tool for recruiters to find the best-fitting schools for a specific student based on their preferences and documents.

---

## 📂 Backend Architecture (Supabase)

### Key Tables
- `profiles`: Extended user data linked to Auth.
- `institutions`: Profile data for educational entities.
- `programs`: Available courses with pricing and requirements.
- `students`: Recruiter-owned student database.
- `applications`: The central link between students, programs, and recruiters.
- `refund_requests`: Management of financial cancellations.
- `balance_history` & `payout_requests`: Financial ledger.
- `chats` & `messages`: Communication engine.
- `tickets` & `ticket_messages`: Support system.

### Business Logic Implementation
- **RLS (Row Level Security):** Ensures data isolation (e.g., recruiters see only their students; institutions see only applications to their programs).
- **Triggers:** Automatically update student statuses when an application status changes.
- **RPC (Database Functions):** Specialized functions for calculating recruiter statistics and managing complex state transitions.
- **Storage:** Private buckets for sensitive student documents (Passport, Transcript).

---

## 📈 Status Models

### Student Status Lifecycle
`New Student` → `Follow up` → `Ready to apply` → `Application started` → `Waiting payment` → `Ready for visa` → `Visa Approved` → `Done` (Also supports `Refund`, `Refund Requested`, `Cancelled`).

### Application Status Lifecycle
`New application` → `In review` → `Approved` / `Rejected` → `Waiting payment` → `Payment received` → `Ready for visa` → `Visa Approved` → `Done` (Also supports `Refund Requested`, `Cancelled`).

---

## 📦 Getting Started

1. **Environment Variables:**
   Create a `.env` file with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_url
   VITE_SUPABASE_ANON_KEY=your_key
   ```
2. **Installation:** `npm install`
3. **Development:** `npm run dev`
4. **Database Setup:** Apply `supabase_schema.sql` to your Supabase SQL Editor.

---
*Created with focus on high-performance educational recruiting and transparent financial interactions.*
