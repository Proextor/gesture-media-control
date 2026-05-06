# Gesture Media Control

A gesture-based media control system that allows users to control system media and volume using real-time hand tracking and computer vision.

This project combines gesture recognition, real-time interaction, and desktop integration to create a hands-free media control experience.

---

## Features

- Real-time hand gesture recognition
- Media playback control using gestures
- System volume adjustment
- Interactive overlay feedback
- Webcam-based tracking
- Desktop application support using Electron
- Responsive frontend interface

---

## Tech Stack

### Frontend
- React
- Vite
- JavaScript

### Backend
- Node.js
- Express
- WebSockets

### Computer Vision
- MediaPipe
- OpenCV

### Desktop Integration
- Electron

---

## Project Structure

```bash
gesture-media-control/
│
├── backend/        # Server logic and media control
├── frontend/       # React frontend application
├── electron/       # Electron desktop wrapper
├── shared/         # Shared constants and types
└── README.md
```

---

## How It Works

The application uses webcam input to detect and track hand gestures in real time. Gesture data is processed using MediaPipe and mapped to specific media control actions such as:

- Play / Pause
- Volume Up
- Volume Down
- Swipe-based controls

The frontend overlay provides visual feedback while the backend communicates with the operating system to trigger media actions.

---

## Installation

### Clone the Repository

```bash
git clone https://github.com/Proextor/gesture-media-control.git
cd gesture-media-control
```

---

### Install Dependencies

```bash
npm install
cd frontend && npm install
cd ../backend && npm install
```

---

## Running the Application

### Start Backend

```bash
cd backend
npm start
```

### Start Frontend

```bash
cd frontend
npm run dev
```

### Start Electron App

```bash
npm run electron
```

---

## Future Improvements

- Custom gesture mapping
- AI-based gesture learning
- Improved gesture smoothing
- Cross-platform optimization
- Additional media shortcuts
- Better UI customization

---

## Learning Outcomes

This project helped me explore:

- Real-time computer vision systems
- Gesture recognition workflows
- Human-computer interaction
- Frontend and backend integration
- Desktop application development
- WebSocket communication

---

## Author

### Nishanth A A

Engineering Student • Developer • CTF Player

GitHub:
https://github.com/Proextor
