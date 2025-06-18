import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import './i18n';
import 'ag-grid-enterprise';
import { LicenseManager } from 'ag-grid-enterprise';
import i18n from 'i18next';

const licenseKey = import.meta.env.VITE_AG_GRID_LICENSE;
if (licenseKey) {
  LicenseManager.setLicenseKey(licenseKey);
}

const env = import.meta.env.VITE_APP_ENV;

if (sessionStorage.getItem('language')) {
  if (sessionStorage.getItem('language') === 'Italian') {
    i18n.changeLanguage('it');
  } else if (sessionStorage.getItem('language') === 'English') {
    i18n.changeLanguage('en');
  }
} else {
  i18n.changeLanguage('en');
}

async function setup() {
  if (env === 'local') {
    if (sessionStorage.getItem('apitoken')) {
      console.log('API token already set in sessionStorage');
    } else {
      console.log('Fetching API token...');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/v1/auth/user/login`, {
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

  let container: HTMLElement | null;

  container = document.getElementById('root');

  if (!container) {
    throw new Error('Root container not found');
  }

  ReactDOM.createRoot(container).render(
    <div
      id="react-container"
      className="flex flex-col w-full overflow-x-hidden !text-black !bg-white !text-xl mb-24"
    >
      <HashRouter>
        <App />
      </HashRouter>
    </div>
  );
}

setup();
