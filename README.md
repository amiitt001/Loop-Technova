# Tech Nova - GCET Official Technical Club Website

Welcome to the official repository for the **Tech Nova** website, a futuristic, high-performance platform for the technical club of Galgotias College of Engineering and Technology (GCET).

This project features a modern, dark-themed UI with neon aesthetics, advanced animations, and a secure internal admin panel for club management.

## 🚀 Features

### Public Website
- **Futuristic UI**: Customized dark theme with neon cyan/violet accents and glassmorphism effects.
- **Interactive Home Page**: 
    - Animated "Particles" Hero section.
    - "Credibility Strip" with live counters.
    - "About System" HUD layout.
- **Team Section**: Detailed profile cards with hover reveals and social links.
- **Events & Registration**: 
    - Real-time event timeline.
    - **Instant Registration**: Public users can register for open events instantly.
- **Join Us (Membership)**: 
    - Detailed application form (Branch, Year, GitHub, etc.).
    - Automated status tracking.
- **Leaderboard**: Gamified ranking system for club contestants.
- **Chatbot**: Built-in rule-based assistant to guide visitors.

### Admin Panel (Secure)
- **Dashboard**: Real-time overview of members, events, and stats.
- **Authentication**: Firebase-powered secure login for admins only.
- **Live Event Management**: 
    - Create/Edit events.
    - **View Registrations**: Real-time list of registered students with export options.
- **Membership Applications**: 
    - **Real-time Review**: Approve/Reject applications instantly.
    - View detailed applicant profiles (GitHub, Branch, College).
- **Team & Contestants**: Manage internal team members and leaderboard scores.

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite
- **Styling**: Vanilla CSS (Custom Variables), Framer Motion (Animations), Lucide React (Icons)
- **Backend / Services**: 
    - **Firebase Authentication**: Admin security.
    - **Firebase Firestore**: Real-time NoSQL database.
- **Routing**: React Router DOM v7

## 📂 Project Structure

```bash
src/
├── components/     # Reusable UI components (Navbar, Cards, Chatbot, Modals)
├── contexts/       # Global state (AuthContext)
├── layouts/        # Layout wrappers (AdminLayout)
├── pages/          # Route pages (Home, Team, Dashboard, Join)
│   └── admin/      # Secure admin views (Applications, Registrations, Events)
├── assets/         # Static assets
└── firebase.js     # Firebase configuration
```

## ⚡ Getting Started

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/technova.git
    cd technova
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Firebase:**
    - Create a `.env` file or update `src/firebase.js` with your Firebase credentials:
    ```javascript
    const firebaseConfig = {
      apiKey: "YOUR_API_KEY",
      authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
      projectId: "YOUR_PROJECT_ID",
      storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
      messagingSenderId: "SENDER_ID",
      appId: "APP_ID"
    };
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

## 👥 Core Team

- **President**: Alex Chen (Lead)
- **Vice President**: Sarah Jones
- **Tech Lead**: Kirti
- **Marketing Lead**: Jhanak
- **Event Lead**: Arpita

---
*Built with 💻 and ☕ by the Tech Nova Team.*