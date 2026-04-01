import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary';
import { registerSW } from 'virtual:pwa-register';

// Register service worker for offline support
if ('serviceWorker' in navigator) {
  registerSW({
    onNeedRefresh() {
      console.log('New content available, please refresh.');
    },
    onOfflineReady() {
      console.log('App ready to work offline.');
    },
  });
}

import { toast } from 'sonner';

// Global error handling for non-React errors
window.addEventListener('error', (event) => {
  console.error('Global Error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled Promise Rejection:', event.reason);
  
  let errorMessage = 'An unexpected error occurred.';
  try {
    const reason = event.reason?.message || event.reason;
    const parsedError = JSON.parse(reason);
    if (parsedError.error) {
      errorMessage = parsedError.error;
    }
  } catch (e) {
    errorMessage = event.reason?.message || String(event.reason);
  }

  // Only show toast if it's a meaningful error
  if (errorMessage && errorMessage !== 'undefined' && !errorMessage.includes('Quota exceeded')) {
    toast.error(errorMessage);
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
