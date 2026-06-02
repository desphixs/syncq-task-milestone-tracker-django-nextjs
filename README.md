# Syncq: Task and Milestone Tracker

Syncq is a private project management and milestone tracking system designed to give users complete control over their tasks. It provides a sleek, modern workspace where users can create projects, outline specific task lists, set priority tags, and monitor overall progress with visual milestone indicators. The application is built with security at its core, enforcing strict backend data isolation to guarantee that every user's workspace remains completely private and locked down from others.

This application is designed as an educational project featured on [staqed.com](https://staqed.com), the premier platform where you can learn to build real-world, industry-standard full-stack web applications from scratch.

---

## Technical Stack

The architecture separates the frontend and backend to demonstrate modern production design:

- **Backend:** Python and Django with Django REST Framework (DRF) for hand-crafted RESTful API endpoints.
- **Database:** SQLite for lightweight and robust relational data storage.
- **Frontend:** Next.js (App Router) with TypeScript for highly optimized client-side pages and server actions.
- **Styling & UI:** Tailwind CSS for a modern, responsive, utility-first user interface and Lucide React for consistent iconography.

---

## Core Application Features

- **Authentication System:** Pre-built traditional credential login, social auth integrations (Google and GitHub), and passwordless flow templates.
- **Workspace Project CRUD:** Create, list, edit, and safely delete user-owned projects and client workspaces.
- **Task Kanban Boards:** Create, update, and manage tasks organized by columns representing "To Do", "Doing", and "Done" states.
- **Computed Milestone Progress:** Dynamic progress metrics generated directly by the backend to calculate completion rates and percentage indicators.
- **Advanced Metrics Analytics:** Dedicated analytics views calculating project counts, pending tasks, priority levels, and upcoming or overdue deadlines.
- **Sorting, Filtering, and Search:** Query tasks dynamically on the backend by status, urgency priority, deadline date, and search keywords.
- **Theme Integration:** Clean, elegant dark and light mode UI matching premium design standards.

---

## Project Structure

```text
synced/
├── backend/            # Django REST API (endpoints, tracker app, models, userauths)
├── frontend/           # Next.js App Router (dashboard, projects pages, UI components)
└── docs/               # Detailed study plans and tasks for the building process
```

---

## Getting Started

### 1. Prerequisites

Make sure you have the following installed on your machine:

- Python 3.12+
- Node.js 18+ & npm

### 2. Backend Setup

1. Navigate to the backend folder:
    ```bash
    cd backend
    ```
2. Create and activate a Python virtual environment:
    ```bash
    python -m venv venv
    # On Windows:
    .\venv\Scripts\activate
    # On macOS/Linux:
    source venv/bin/activate
    ```
3. Install the required Python packages:
    ```bash
    pip install -r requirements.txt
    ```
4. Create your local environment file:
    - Copy `.env.template` to `.env`.
    - Configure the default development variables.
5. Run migrations to initialize the database:
    ```bash
    python manage.py migrate
    ```
6. Start the Django development server (default port `8000`):
    ```bash
    python manage.py runserver
    ```

### 3. Frontend Setup

1. Navigate to the frontend folder:
    ```bash
    cd ../frontend
    ```
2. Install the node packages:
    ```bash
    npm install
    ```
3. Create your local environment file:
    - Copy `.env.template` to `.env.local`.
    - Configure the API base URLs to point to your backend.
4. Start the Next.js development server (default port `3000`):
    ```bash
    npm run dev
    ```

Now open your browser and navigate to `http://localhost:3000` to interact with the full application!

---

## Learning Goals on Staqed

While building Syncq on [staqed.com](https://staqed.com), you will master:

1. **Relational State and Ownership:** Connecting custom models (User, Project, and Task) through ForeignKey relationships, establishing strict cascade deletion logic, and performing reverse ORM queries.
2. **Absolute Data Isolation:** Implementing secure API views that manually filter and validate database records based on the authenticated requesting user, ensuring data isolation across the entire API gateway.
3. **Explicit DRF Handlers:** Developing clean backend API views and serializers that handle inputs step-by-step, avoiding hidden magic decoders so the full data flow is clear and readable.
4. **Interactive UI Integration:** Linking a dynamic Next.js App Router frontend with Django REST API, managing local React state, rendering premium grid components, and providing custom success toasts and loading skeletons.

---

_This project is part of the full-stack developer path on [staqed.com](https://staqed.com)._
