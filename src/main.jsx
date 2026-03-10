import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { RoutineProvider } from './context/RoutineContext.jsx' // Importe o Provider

// Set initial theme based on saved preference or default to dark
const saved = localStorage.getItem('routine_theme');
const initialTheme = (saved === 'light' || saved === 'dark') ? saved : 'dark';
document.documentElement.classList.remove('light', 'dark');
document.documentElement.classList.add(initialTheme);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RoutineProvider>
      <App />
    </RoutineProvider>
  </React.StrictMode>,
)