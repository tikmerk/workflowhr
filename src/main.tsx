import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/common/ErrorBoundary.tsx';
import './index.css';
import { loadFaceApiModels } from './utils/faceRecognitionEngine';

// Immediate background warmup on application boot: downloads models and compiles WebGL shaders
if (typeof window !== 'undefined') {
  loadFaceApiModels().catch((e) => {
    console.warn('[boot] Background AI face engine warmup notice:', e);
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
