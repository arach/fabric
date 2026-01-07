import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import { DaytonaPage } from './pages/DaytonaPage';
import { E2BPage } from './pages/E2BPage';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/daytona" element={<DaytonaPage />} />
        <Route path="/e2b" element={<E2BPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
