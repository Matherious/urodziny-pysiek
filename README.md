# Urodziny v2 - Party App

A modern, full-stack event management application built with Next.js, React 19, and Prisma.

## Features

- **RSVP Management:** Guests can confirm their attendance.
- **Admin Dashboard:** Real-time statistics, guest list management.
- **Theme Engine:** Configurable themes for the UI.
- **Rate Limiting:** Protects API endpoints.
- **Smart Visibility:** content gating based on rules.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Database:** SQLite (dev) / PostgreSQL (prod ready via Prisma)
- **Styling:** Tailwind CSS + Shadcn UI
- **ORM:** Prisma

## Prerequisites

- **Node.js:** v20 or higher
- **npm:** v10 or higher

## Getting Started

1.  **Install Dependencies:**

    ```bash
    npm install
    ```

2.  **Environment Setup:**
    
    Copy the example environment file (if available) or create `.env` with necessary keys (DATABASE_URL, etc.).
    
    *Note: For local development with SQLite, `DATABASE_URL="file:./dev.db"` is sufficient.*

3.  **Database Setup:**

    ```bash
    # Create the database and apply migrations
    npx prisma migrate dev --name init
    
    # (Optional) Seed the database with initial data
    npm run prisma:seed
    ```

4.  **Run Development Server:**

    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) to view the app.

## Available Scripts

The `scripts/` folder contains useful utilities:

- `bootstrap.sh`: Initial setup helper.
- `prod-start.sh`: Production startup script.
- `add-*.ts`: Scripts to add specific guests programmatically.
- `prepare-transfer.sh`: **Transfer Tool** - packs the project and serves it for local sharing.

## How to Transfer This Project

To share this project with a colleague on the same local network:

1.  Run the transfer script:
    
    ```bash
    chmod +x scripts/prepare-transfer.sh
    ./scripts/prepare-transfer.sh
    ```

2.  The script will:
    - Clean up temporary files.
    - Create a `urodziny_v2_bundle.zip` archive (excluding heavyweight folders like `node_modules`).
    - Start a temporary web server.

3.  **On the colleague's machine:**
    - Open the URL provided by the script (e.g., `http://192.168.1.X:8000`).
    - Download the zip file.
    - Extract it.
    - Run `npm install` and `npx prisma migrate dev` to start.
