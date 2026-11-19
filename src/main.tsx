import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import { Providers } from './app/providers'
import './styles/index.css'

// dev only: Safari keeps the whole page (bfcache) when switching apps/going back → you'd see a stale version → reload
if (import.meta.env.DEV) {
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) location.reload()
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers>
      <App />
    </Providers>
  </StrictMode>,
)
