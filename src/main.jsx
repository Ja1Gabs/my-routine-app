import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { RoutineProvider } from './context/RoutineContext.jsx'
import { ToastProvider } from './components/ui/ToastProvider.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ToastProvider>
      <RoutineProvider>
        <App />
      </RoutineProvider>
    </ToastProvider>
  </React.StrictMode>,
)
