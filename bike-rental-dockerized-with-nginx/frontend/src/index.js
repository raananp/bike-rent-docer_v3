import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { CssBaseline, GlobalStyles } from '@mui/material';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <CssBaseline />
    <GlobalStyles
      styles={{
        'html, body, #root': {
          height: '100%',
          width: '100%',
          margin: 0,
          padding: 0,
          backgroundColor: '#121212', // Dark background
          overflowX: 'hidden',
          fontFamily: 'Roboto, sans-serif',
        },
        '*': {
          boxSizing: 'border-box',
        },
        a: {
          textDecoration: 'none',
          color: 'inherit',
        },
      }}
    />
    <App />
  </BrowserRouter>
);
