# Exper — Personal Wealth Management & Financial Planning Dashboard

> **Tagline**: Personal Wealth. Your money, in perspective.  
> **Currency**: Indian Rupee (INR ₹)  
> **Design Philosophy**: Modern Light Fintech (Warm Ivory `#F7F8F5`, Forest Emerald `#137C5A`, Deep Charcoal `#17231D`), Apple-level simplicity, Linear's precision, and Stripe's financial aesthetic.  
> **Timezone**: Asia/Kolkata  
---

## 🌟 Overview

**Exper** is a world-class personal wealth and expense management application designed with a modern light fintech aesthetic, backed by a live **Supabase PostgreSQL** cloud database and an exact server-side financial engine.

---

## 🚀 Key Features

### 1. Robust Authentication & Security
- **Email & Password Authentication** with bcrypt password hashing.
- **1-Click Demo Access**: Immediate evaluation with pre-seeded realistic Indian financial records (`demo@exper.app` / `Exper@123`).
- **Password Strength Meter**: Real-time evaluation of password complexity during registration.
- **Forgot Password Workflow**: Multi-step verification code and secure password reset.
- **Strict User-to-User Isolation**: Every database query is verified against the authenticated user; unauthorized cross-account transfers or data access are blocked.

### 2. Financial Calculation Engine
- **Accurate Balance Accounting**: `Account Balance = Opening Balance + Posted Income - Posted Expenses ± Internal Transfers`.
- **Zero Double-Counting**: Transfers between accounts adjust wallet balances without corrupting consolidated income or expense totals.
- **Savings Rate Formula**: `(Net Savings / Income) × 100`.
- **Decimal Precision**: All currency operations round to 2 decimal places to prevent IEEE 754 floating-point inaccuracies.

### 3. Comprehensive Dashboard
- **Summary Cards**: Total Available Balance (brand gradient card), Period Income (+% period change), Period Expenses (+% period change), Net Savings & Savings Rate.
- **Income vs Expense Chart**: Multi-month cash flow comparison using Recharts.
- **Category Donut Chart**: Visual distribution of expenses with interactive percentages and color chips.
- **Budget Utilization Widget**: Real-time progress bars with warning (>80%) and exceeded (>100%) states.
- **Upcoming Bills Widget**: Displays scheduled payments with 1-click **Pay** action.
- **Savings Goals Progress**: Circular and linear progress meters tracking milestones.
- **Recent Transactions Feed**: Color-coded amounts, category badges, and payment method details.

### 4. Transaction Management
- Full CRUD operations with instant atomic balance reconciliation.
- Multi-filter controls: Filter by **Type** (All, Income, Expense, Transfer), **Category**, **Account**, and **Date Range**.
- Instant search across descriptions, merchants, and notes.
- Sort by date and amount.
- **Export to CSV**: Download filtered transaction histories as CSV files.
- Reusable **Quick Add Modal** accessible anywhere in the application.

### 5. Accounts & Digital Wallets
- Support for **Bank Accounts (HDFC, SBI, etc.)**, **UPI Wallets (PhonePe, GPay, Paytm)**, **Cash**, **Credit Cards**, and **Savings Reserves**.
- Consolidated Net Worth overview.
- **Internal Transfer Engine**: Safely move money between accounts (e.g. Bank to UPI wallet) with zero effect on net income or expenses.

### 6. Budget Management
- Monthly category limits (e.g., Food & Dining, Groceries, Shopping, Travel).
- Visual progress bars with dynamic status indicators (`On Track`, `Approaching Limit`, `Over Budget`).
- Historical spending comparison against previous months.

### 7. Bills & Future Obligation Planner
- Manage recurring and one-time bills (Rent, Utilities, Subscriptions, EMI).
- Dynamic status calculation: `Upcoming`, `Due Soon (≤ 3 days)`, `Overdue`, `Paid`.
- **1-Click Pay Bill**: Prompts for payment source, posts the expense transaction atomically, marks the bill as Paid, and **strictly prevents duplicate charges**.

### 8. Savings Goals & Milestones
- Set financial milestones (Emergency Runway Fund, Apple MacBook, Goa Holiday, Vehicle purchase).
- Track target amount, current saved amount, deadline date, and days remaining.
- **Add Contribution Modal**: Choose to contribute manually or deduct from an existing account.

### 9. Analytics & Printable Reports
- View spending by **Weekly**, **Monthly**, **Quarterly**, or **Yearly** intervals.
- Cash flow timeline area chart and top 5 expense categories ranking.
- **Print Statement Mode**: Clean printable layout for records and PDF generation.

### 10. Default & Custom Categories
- Pre-seeded with 15+ Indian expense categories and 8 income categories with custom colors and icons.
- Create custom categories with a color picker.

### 11. Profile & Settings
- Dark / Light mode toggle with persistent local storage.
- Full portable data export as formatted JSON backup.
- **Reset Demo Data**: 1-click button to reset the database with fresh sample data.
- **Permanent Account Deletion**: Secure cascade deletion of user records.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts, date-fns |
| **Backend** | Node.js, Express, TypeScript, Zod, bcryptjs, jsonwebtoken, helmet, cors |
| **Database & ORM** | PostgreSQL (Production) / SQLite (Zero-dependency local dev), Prisma ORM |
| **Testing** | Vitest, Supertest (5 comprehensive test suites covering auth, engine, isolation) |

---

## 📂 Project Structure

```
d:/expense tracker/
├── client/                     # Vite + React TypeScript Frontend
│   ├── src/
│   │   ├── components/         # Header, Sidebar, QuickAddModal, SummaryCard, Toast, ConfirmDialog
│   │   ├── context/            # AuthContext, ThemeContext
│   │   ├── lib/                # API client with fetch wrapper & auth interceptor
│   │   ├── pages/              # Dashboard, Transactions, Accounts, Budgets, Bills, Goals, Analytics, Settings
│   │   ├── types/              # Comprehensive TypeScript interfaces
│   │   ├── utils/              # INR currency formatters, date formatters
│   │   ├── App.tsx             # Main view router and layout
│   │   └── main.tsx            # Root entry point
│   ├── index.html              # HTML5 template with SEO & fonts
│   ├── tailwind.config.js      # Tailwind configuration with Finora theme colors
│   └── vite.config.ts          # Vite configuration with proxy to backend
│
├── server/                     # Express + TypeScript Backend
│   ├── prisma/
│   │   ├── schema.prisma       # SQLite schema (default for local zero-dependency runs)
│   │   ├── schema.postgresql.prisma # PostgreSQL production schema
│   │   └── seed.ts             # Realistic Indian financial database seed script
│   ├── src/
│   │   ├── middleware/         # Auth (JWT) & Zod validation middlewares
│   │   ├── routes/             # Auth, Dashboard, Transactions, Accounts, Budgets, Bills, Goals, etc.
│   │   ├── tests/              # Vitest test suite for security & calculation engine
│   │   ├── utils/              # Financial math rounding & default categories
│   │   ├── index.ts            # Express server entry point
│   │   └── prisma.ts           # PrismaClient singleton
│   ├── .env                    # Local environment variables
│   └── package.json            # Server scripts and dependencies
│
├── package.json                # Root monorepo scripts (dev, build, test, seed)
└── README.md                   # Complete application documentation
```

---

## ⚡ Quick Start & Local Setup

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### Step 1: Clone and Install Dependencies
From the project root:
```bash
npm install
npm --prefix server install
npm --prefix client install
```

### Step 2: Initialize Database & Seed
The application uses SQLite (`dev.db`) locally so you can run it immediately without needing a local PostgreSQL daemon:
```bash
npm --prefix server run prisma:generate
npm --prefix server run prisma:push
npm run seed
```

### Step 3: Run the Development Server
```bash
npm run dev
```
- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000](http://localhost:5000)

### Step 4: Login with Demo Account
- **1-Click Button**: On the login page, click **"1-Click Demo Login"** to immediately log in with full pre-seeded data.
- **Manual Credentials**:
  - Email: `demo@exper.app`
  - Password: `Exper@123`

---

## 🧪 Running Automated Tests

Run the test suite:
```bash
npm test
```
The automated test suite verifies:
1. Rejection of invalid credentials.
2. Strict user-to-user data isolation (and blocks illicit cross-user transfers).
3. Accurate financial calculations for balances, income, expenses, and savings rates.
4. Internal transfers adjust accounts without double-counting income or expenses.
5. Bill payment workflow and duplicate payment prevention.

---

## 🌐 Production PostgreSQL Deployment

To deploy the backend with PostgreSQL (e.g., Supabase, Neon, Railway, or AWS RDS):
1. In `server/.env`, set your connection string:
   ```env
   DATABASE_URL="postgresql://postgres:password@db.xyz.supabase.co:5432/postgres?sslmode=require"
   ```
2. Replace `server/prisma/schema.prisma` with `server/prisma/schema.postgresql.prisma`.
3. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```
4. Deploy the frontend to **Vercel** and set the `VITE_API_URL` to your production backend URL.

---

## 🛡️ Security & Privacy Standards
- Passwords hashed using `bcrypt` (10 salt rounds).
- HTTP headers secured via `helmet`.
- CORS restricted to allowed domains.
- API rate limiting enabled via `express-rate-limit`.
- Safe error handling without leaking database credentials or stack traces to clients.
