# Image Sorter UI 🎨

The frontend interface for the Image Sorter Pro application, built with **React**, **Vite**, and **Tailwind CSS**.

## 🚀 Development

### Setup

```bash
npm install
```

### Dev Server

To run the UI in standalone mode (with mocked API calls):

```bash
npm run dev
```

The application detects if it's running in a browser environment (outside of PyWebview) and mocks the file system API calls, allowing you to iterate on the UI design without the Python backend running.

### Build

To communicate with the Python backend, the UI must be built into static files:

```bash
npm run build
```

The output will be generated in the `dist` directory.

## 📂 Project Structure

- `src/App.jsx`: Main application logic and UI layout.
- `src/index.css`: Global styles and Tailwind directives.
- `src/lib`: Helper functions (if any).
- `dist/`: production build artifacts (generated).

## 🎨 Styling

Styling is handled using **Tailwind CSS**.

- **Dark Mode**: The app is designed with a dark aesthetic by default using Slate colors (`bg-slate-900`, etc.).
- **Animations**: **Framer Motion** is used for page transitions and interactive elements.
