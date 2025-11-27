# 🎯 SparkBets - P2P Sports Betting Platform

A modern, feature-rich peer-to-peer sports betting platform built with React and Tailwind CSS.

## ✨ Features

- 🔐 User Authentication (Login/Register/Password Reset)
- 🎲 Multiple Betting Markets (Match Winner, Goals, Corners, Cards, etc.)
- 🔴 Live Betting with Real-time Updates
- 💰 Wallet System (Balance, Bonus, Withdrawable)
- 📱 Responsive Design
- 🎨 Modern UI with Tailwind CSS

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Start development server:**
```bash
npm start
```

3. **Open your browser:**
Visit `http://localhost:3000`

## 📁 Project Structure

```
sparkbets/
├── public/
│   └── index.html
├── src/
│   ├── App.jsx              # Main application
│   ├── index.js             # Entry point
│   └── index.css            # Global styles
├── package.json
├── tailwind.config.js
└── README.md
```

## 🎮 How to Use

1. **Register/Login** - Create an account or login (demo mode)
2. **Browse Matches** - View live and upcoming matches
3. **Place Bets** - Select outcomes and enter bet amounts
4. **Track Bets** - Monitor your active bets
5. **Manage Wallet** - View balance and bonuses

## 🔧 Development

### Available Scripts

- `npm start` - Run development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

### Environment Variables

Copy `.env.example` to `.env` and fill in your API keys:

```bash
cp .env.example .env
```

## 🛠️ Tech Stack

- **Frontend:** React 18, Tailwind CSS
- **Icons:** Lucide React
- **State Management:** React Hooks
- **Storage:** localStorage (demo)

## 📋 Roadmap

- [ ] Firebase Authentication
- [ ] Real Sports API Integration
- [ ] M-Pesa Payment Integration
- [ ] Bet Settlement System
- [ ] Admin Dashboard
- [ ] Multi-bet Support
- [ ] Live Streaming

## ⚠️ Legal Notice

This is a demonstration project with mock data. Operating a betting platform requires:
- Proper licensing (BCLB in Kenya)
- Age verification (18+)
- Responsible gambling features
- Regulatory compliance

## 📝 License

MIT License - Educational/Demo purposes only

---

**Built with ❤️ for sports betting enthusiasts**
⚽ P2P Football Betting Platform
A peer-to-peer betting platform that matches users with opposing predictions on football matches. Built with React and powered by real-time football data from API-Football.
🌟 Features
Core Betting Features

Live Match Data - Real-time football match information from 100+ leagues worldwide
Multiple Markets - Match winner, over/under, both teams to score, and more
Live Betting - Place bets on matches in progress
Match Statistics - Detailed stats, lineups, and live updates

Peer-to-Peer Matching System

Smart Survey - 3-step questionnaire to understand betting preferences
Automatic Matching - Algorithm finds users with opposite predictions on the same matches
Real-time Notifications - Get notified instantly when a betting partner is found
Match Management - Accept, decline, or view all your matched bets
Status Tracking - Monitor pending, waiting, and active P2P bets

User Experience

Responsive Design - Works seamlessly on desktop, tablet, and mobile
Dark Theme - Eye-friendly dark mode interface
Search & Filter - Find specific matches quickly
Live Updates - Automatic score updates every 45 seconds
User Dashboard - Track your betting history and statistics

🚀 Getting Started
Prerequisites

Node.js (v14 or higher)
npm or yarn
API-Football API key (get from API-Football)
