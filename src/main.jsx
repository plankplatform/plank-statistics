import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import './index.css';

import 'ag-grid-enterprise';

import { LicenseManager } from 'ag-grid-enterprise';

const licenseKey = import.meta.env.VITE_AG_GRID_LICENSE;
if (licenseKey) {
  LicenseManager.setLicenseKey(licenseKey);
}

const env = import.meta.env.VITE_APP_ENV;

console.log('Environment:', env);

if (env === 'local') {
  if (sessionStorage.getItem('apitoken')) {
    console.log('API token already set in sessionStorage');
  } else {
    const response = await fetch('https://api-dev.plank.global/v1/auth/user/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userid: import.meta.env.VITE_API_USER,
        password: import.meta.env.VITE_API_PASSWORD,
      }),
    });

    const data = await response.json();
    if (data.jwt) {
      sessionStorage.setItem('apitoken', data.jwt);
    } else {
      console.error('Failed to fetch API token:', data);
    }
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <div id="react-container" className="flex flex-col h-full w-full">
    <HashRouter>
      <App />
    </HashRouter>
  </div>
);
