import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import logo from './assets/logo.png'

const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]')

if (favicon) {
    favicon.href = logo
} else {
    const link = document.createElement('link')
    link.rel = 'icon'
    link.type = 'image/png'
    link.href = logo
    document.head.appendChild(link)
}


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
