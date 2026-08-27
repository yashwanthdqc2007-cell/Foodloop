# FoodLoop

## Overview
FoodLoop is a smart food redistribution platform that connects restaurants with surplus food to customers and community organizations in real-time. By leveraging AI allocation logic, FoodLoop minimizes food waste while maximizing social and economic impact.

## Problem Statement
Every day, perfectly good food goes to waste at restaurants and food outlets because of overproduction or unpredictable demand. Meanwhile, community organizations and budget-conscious customers are constantly looking for affordable and accessible food options. The gap between surplus food and the people who need it causes massive environmental and economic loss.

## Key Features
- **Real-Time Marketplace**: Live listings of surplus food from local restaurants.
- **AI-Powered Allocation**: Smart matching algorithms to prioritize high-need communities and fair distribution.
- **Safety Engine**: Automated safety checks for food perishability, recalls, and handling guidelines.
- **Dynamic Pricing**: Customers get discounted meals, and restaurants recover sunk costs.
- **Multi-Role Dashboards**: Tailored interfaces for Customers, Restaurants, Communities, and Admins.

## Workflows

### Customer Workflow
1. Browse available discounted surplus food in their area.
2. Filter by dietary preferences (e.g., VEG, ALL).
3. Claim or purchase food listings.
4. Track order status and provide reviews.

### Restaurant Workflow
1. Quickly list surplus food with quantity, price, and expiry time.
2. Monitor active listings and manage incoming orders.
3. Track metrics on food saved, revenue recovered, and community impact.

### Community Workflow
1. Receive notifications or browse bulk food donations.
2. Claim food for shelters, food banks, or community kitchens.
3. Manage pickups and report on distribution impact.

### Admin/Moderation Workflow
1. Monitor all active transactions and users.
2. Review flagged listings or users.
3. Ensure platform safety and compliance using the automated safety engine.

## Core Logic

### AI/Allocation Logic
FoodLoop utilizes an AI Allocation Engine to intelligently route food to the most appropriate recipients. It evaluates:
- Proximity and urgency of the food's expiry.
- Historical claim rates and community needs.
- Dietary preferences and restrictions.

### Safety Logic
The built-in Safety Engine automatically screens food listings for:
- Temperature abuse risks (e.g., highly perishable items listed for too long).
- FDA/Local health guideline compliance.
- Banned or hazardous food items.

## Tech Stack
- **Frontend**: React, Vite, Tailwind CSS.
- **Backend**: Node.js, Express.js.
- **Database**: SQLite (local dev friendly).
- **AI Integration**: Google Gemini API (optional/mocked in dev).

## Project Architecture
```
FoodLoop/
├── client/          # React + Vite frontend
├── server/          # Node.js + Express backend
│   ├── controllers/ # API controllers
│   ├── database/    # SQLite schema & seed scripts
│   ├── routes/      # Express routes
│   └── services/    # AI Allocation & Safety Engines
├── .gitignore
└── README.md
```

## Local Setup Instructions

### Prerequisites
- Node.js (v18+)
- npm

### One-Click Launcher (Windows)
Double-click `Start FoodLoop.bat` in the FoodLoop root. It starts the existing Express backend and Vite frontend in separate terminal windows, waits for the API health check, and opens FoodLoop in the default browser. To stop the development processes, double-click `Stop FoodLoop.bat`.

### Manual Setup
1. **Install Backend Dependencies**:
   ```bash
   cd server
   npm install
   ```
2. **Seed the Database**:
   ```bash
   npm run seed
   ```
3. **Start the Backend**:
   ```bash
   npm start
   ```
4. **Install Frontend Dependencies**:
   ```bash
   cd ../client
   npm install
   ```
5. **Start the Frontend**:
   ```bash
   npm run dev -- --host 127.0.0.1
   ```

## Demo Credentials
To explore the different roles, you can log in using the following seed credentials (these are dummy passwords for local development only):

- **Admin**: `admin@foodloop.com` / `admin123`
- **Customer**: `customer@foodloop.com` / `password123`
- **Restaurant**: `restaurant@foodloop.com` / `password123`
- **Community**: `community1@foodloop.com` / `password123`

*Note: Do not use real passwords or expose secrets in your `.env` file.*

## Future Scalability/Features
- Integration with real-time delivery logistics (e.g., DoorDash Drive / Uber Direct).
- Advanced analytics for restaurants to predict surplus.
- Mobile application using React Native.
- Migration to PostgreSQL for production scalability.

## Screenshots
> *Placeholder: Add screenshots of the marketplace, dashboards, and mobile views here.*

## Team/Contribution
Contributions are welcome! Please read the contributing guidelines before submitting pull requests. Let's work together to eliminate food waste.
