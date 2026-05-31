# Django + Next.js Boilerplate

**The foundation for real world fullstack applications.**

This boilerplate is a production-ready, batteries-included starter kit designed to bridge the gap between **Django’s** robust backend capabilities and **Next.js’s** unparalleled frontend performance. From comprehensive authentication flows to automated developer workflows, everything is pre-configured.

---

## Key Features

### 🔐 Advanced Authentication System

A complete, secure, and flexible auth system out of the box:

- **Traditional:** Email & Password login with robust validation.
- **Social Auth:** Seamless integration with **GitHub** and **Google**.
- **Passwordless:** Magic Link and OTP (One-Time Password) login support.
- **Security:** Password reset and password change workflows pre-built.
- **Account Management:** Profile updates, account settings, and avatar management.

### 🎨 Frontend & UI/UX

- **Next.js Architecture:** Optimized for speed and SEO.
- **Auth Context:** Global authentication state management.
- **Theming:** Full **Dark/Light Mode** support powered by Tailwind CSS.
- **Responsive Design:** Fully mobile-responsive profile and settings pages.

### ⚙️ Backend & Infrastructure

- **Django Core:** Clean architecture with a focus on scalability.
- **Email System:** Fully wired-in SMTP configuration for transactional emails (Reset links, OTPs, etc.).
- **API Ready:** Structured to communicate effortlessly with the Next.js frontend.

### 🛠️ Developer Experience (DX)

Custom automation scripts to speed up your workflow:

- `g.bat`: Automated GitHub commit and push workflow.
- `menu.bat`: A custom CLI menu to manage Django commands (Runserver, Migrations, Shell, etc.).

---

## 🛠️ Tech Stack

| Layer        | Technology                       |
| ------------ | -------------------------------- |
| **Backend**  | Django                           |
| **Frontend** | Next.js, React                   |
| **Styling**  | Tailwind CSS                     |
| **Database** | PostgreSQL (or SQLite for local) |
| **State**    | React Context API                |
| **Scripts**  | Batch (.bat) for Windows         |

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/desphixs/Staqed-Django-and-Next.js-Boilerplate
cd your-repo-name

```

### 2. Backend Setup

1. Create a virtual environment: `python -m venv venv`
2. Activate it: `venv\Scripts\activate`
3. Install dependencies: `pip install -r requirements.txt`
4. Configure your `.env` file (see `.env.template`).
5. Run migrations: `python manage.py migrate`

### 3. Frontend Setup

1. Navigate to the frontend folder: `cd frontend`
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`

---

## ⌨️ Automation Scripts

This boilerplate includes custom Windows batch scripts to streamline your development:

### **The Django Menu**

Instead of remembering long commands, run:

```bash
.\menu.bat

```

_Gives you quick access to migrations, superuser creation, and starting the server._

### **One-Click Commits**

To push your changes to GitHub instantly:

```bash
.\g.bat "Your commit message here"

```

## 📝 Versioning

**Current Version:** `1.0.0` (Initial Release)

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 📄 License

This project is [MIT](https://choosealicense.com/licenses/mit/) licensed.

---

**Built with ❤️ for developers who want to move fast**

---

**Sponsored by [Staqed](https://staqed.com)**

#### v.10
