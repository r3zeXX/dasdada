# AeroDash - Premium Environment Dashboard

An enterprise-grade, responsive web application for monitoring weather and air quality (PM2.5) indices.

## Project Overview
This project adheres to modern software engineering best practices, emphasizing modularity, performance, and maintainability. It is built strictly with HTML5, Vanilla JavaScript ES6+, and CSS3. 

## Features
- **Design System**: A robust, token-based light-mode color system implementing Microsoft Fluent and Google Material 3 philosophies.
- **Architecture**: BEM methodology for CSS, ensuring scalable and non-conflicting styles. Fluid typography using `clamp()`.
- **UI Components**: Implementations of Reusable Cards, Badges, Modals, Skeleton Loaders, Toasts, Breadcrumbs, and more.
- **Performance**: Semantic HTML, ARIA accessibility standards, robust error handling, and asynchronous data fetching.

## Folder Structure
```
project/
├── index.html
├── weather.html
├── pm25.html
├── css/
│   ├── variables.css
│   ├── reset.css
│   ├── layout.css
│   ├── components.css
│   ├── animations.css
│   └── style.css
├── js/
│   ├── app.js
│   ├── api.js
│   ├── weather.js
│   ├── pm25.js
│   └── router.js
├── assets/
│   ├── weather.json
│   └── pm25.json
└── README.md
```

## Installation & Running Locally
1. Clone or download the repository.
2. Serve the directory using any local web server to bypass CORS issues for local JSON fetching:
   ```bash
   npx serve .
   # or
   python -m http.server
   ```
3. Open `http://localhost:3000` (or the port provided by your server) in a modern web browser.

## Future API Integration
The architecture is decoupled. To replace the mock JSON data with a live backend:
1. Open `js/api.js`.
2. Update the `fetch` URLs from `./assets/weather.json` to your production endpoint (e.g., `https://api.aerodash.com/v1/weather`).
3. The UI gracefully handles loading states (Skeleton loaders) and errors (Toast notifications) automatically.

## License
MIT License. Copyright 2026 AeroDash Systems.
