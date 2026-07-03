import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Intercept fetch to prefix /api/ requests with subfolder path if running in a subdirectory
const pathname = window.location.pathname;
if (pathname !== "/" && pathname.startsWith("/")) {
  const segments = pathname.split("/");
  const baseSegment = segments[1]; // e.g., "modul-ajar"
  if (baseSegment && baseSegment !== "api") {
    const originalFetch = window.fetch;
    window.fetch = function (input, init) {
      if (typeof input === "string" && input.startsWith("/api/")) {
        input = `/${baseSegment}${input}`;
      }
      return originalFetch.call(this, input, init);
    };
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
