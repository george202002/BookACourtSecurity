import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Bootstrap with custom theme (must be first)
import './styles/bootstrap-custom.scss'

// Design system CSS variables and global micro-interactions
import './index.css'

// Custom overrides for styles Bootstrap can't handle
import './styles/custom-overrides.css'

import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)