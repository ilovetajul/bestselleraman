import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AppProvider } from './context/AppContext';
import { AdminApp } from './features/admin/AdminApp';
import './index.css';

// Admin is intentionally a separate app tree: it doesn't need Practice
// mode's localStorage-based progress context, and it deliberately skips the
// mobile bottom-nav/sidebar chrome in favor of a focused back-office layout.
// This is a lightweight path check rather than a full router — the actual
// access control for admin data lives server-side (RLS + requireAdmin in
// every Edge Function), never in this client-side branch alone.
const isAdminRoute = window.location.pathname.startsWith('/admin');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isAdminRoute ? (
      <AdminApp />
    ) : (
      <AppProvider>
        <App />
      </AppProvider>
    )}
  </React.StrictMode>
);
