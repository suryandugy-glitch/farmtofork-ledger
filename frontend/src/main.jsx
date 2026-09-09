import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'
import i18n from './i18n'
import { useEffect } from 'react'

// Function to set dark mode based on preference
const setDarkMode = (isDark) => {
  if (isDark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

// Check for saved user preference or use system preference
useEffect(() => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme) {
    setDarkMode(savedTheme === 'dark')
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    setDarkMode(prefersDark)
  }
}, [])

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)