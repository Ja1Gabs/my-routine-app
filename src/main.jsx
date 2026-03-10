import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { RoutineProvider } from './context/RoutineContext.jsx' // Importe o Provider

// Force light mode BEFORE React renders to prevent dark flash
document.documentElement.classList.remove('dark');
document.documentElement.classList.add('light');
document.documentElement.style.backgroundColor = 'white';
document.documentElement.style.color = 'black';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RoutineProvider>
      <App />
    </RoutineProvider>
  </React.StrictMode>,
)