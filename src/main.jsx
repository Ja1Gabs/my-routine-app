import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { RoutineProvider } from './context/RoutineContext.jsx' // Importe o Provider

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RoutineProvider>
      <App />
    </RoutineProvider>
  </React.StrictMode>,
)