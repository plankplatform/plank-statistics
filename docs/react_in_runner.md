**Integrazione di una App React in PHPRunner**

**Creazione della pagina custom**

La pagina viene creata tramite UI di Runner.
Dentro allo snippet `/PageEvents/plank_statistics_dashboard/snippet.php` possiamo scrivere il nostro contenuto custom.
Il file _snippet.php_ esegue le seguenti operazioni:

```php
<?php

$token = $_SESSION['api_token'] ?? '';
$cacheBuster = time();

echo '
  <style>
    html,
    body,
    body.function-dashboard {
      height: auto !important;
      min-height: 100vh !important;
      width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow-y: visible !important;
      overflow-x: hidden !important;
    }

    .r-topbar-page,
    .r-body, .r-content, .r-data-block, .r-grid,
    #form_grid_1, #form_grid_1 > tbody,
    #form_grid_1 > tbody > tr,
    #form_grid_1 > tbody > tr > td,
    .r-ori-vert {
      height: auto !important;
      width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      display: block !important;
      float: none !important;
      max-width: none !important;
      max-height: none !important;
      position: relative !important;
      overflow: visible !important;
    }

    #shadow-host {
      display: block;
      width: 100%;
      height: auto;
      min-height: 100vh;
    }

    #shadow-host > #root {
      width: 100%;
    }

    #footer:not(#react-wrapper > #footer) {
      display: none !important;
    }
  </style>
';

echo '
<script>
  const token = ' . json_encode($token) . ';
  sessionStorage.setItem("apitoken", token);
</script>

<div id="shadow-host"></div>

<script type="module">
  const host = document.getElementById("shadow-host");
  const shadowRoot = host.attachShadow({ mode: "open" });

  const container = document.createElement("div");
  container.id = "root";
  container.style.width = "100%";
  container.style.minHeight = "100%";
  shadowRoot.appendChild(container);

  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = "/plank/plank-statistics/dist/assets/index.css?v=' . $cacheBuster . '";
  shadowRoot.appendChild(css);

  window.__SHADOW_ROOT__ = shadowRoot;

  import("/plank/plank-statistics/dist/assets/index.js?v=' . $cacheBuster . '");
</script>
';
```

**Cosa fa lo script PHP**

1. Recupera il token salvato in `$_SESSION['api_token']` (impostato dopo il login in `PageEvents/plank_login_page/after_successful.php`) e lo salva in `sessionStorage`, da cui l'app React si aspetta di leggerlo.
2. Imposta regole CSS per garantire che il contenitore dell'app React si espanda correttamente all'interno del layout di PHP Runner e che non venga limitato dai contenitori di Runner.
3. Nasconde il `#footer` di Runner che potrebbe coprire elementi interattivi.
4. Crea il contenitore `#shadow-host` e monta uno Shadow DOM per isolare l'app React dal CSS di Runner.
5. Inietta dinamicamente i file `index.css` e `index.js` risultanti dalla build React.

**Comportamento dell'app React (main.jsx)**

L'app React rileva l’ambiente tramite la variabile `VITE_APP_ENV`. Se siamo in locale (`local`):

- Recupera il token dalle API se non presente in `sessionStorage` e lo salva.
- Monta l’app React direttamente su `#root`.

Se siamo in dev o produzione:

- Monta l’app React dentro al nodo `#root` situato nello Shadow DOM (`window.__SHADOW_ROOT__`).

Il render React è definito così, in _main.jsx_:

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import './index.css';

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

let container;

if (env === 'local') {
  container = document.getElementById('root');
} else {
  container = window.__SHADOW_ROOT__.getElementById('root');
}

ReactDOM.createRoot(container).render(
  <div
    id="react-container"
    className="flex flex-col w-full overflow-x-hidden !text-black !bg-gray-100 !text-xl"
  >
    <HashRouter>
      <App />
    </HashRouter>
  </div>
);
```

Il resto è una normale app React.

Note:

Il contenitore `#react-container` usa le classi Tailwind (`flex flex-col w-full overflow-x-hidden !text-black !bg-gray-100 !text-xl`) per:

- evitare lo scroll orizzontale
- garantire la larghezza piena
- sovrascrivere eventuali stili ereditati dal browser

Viene usato `HashRouter` per evitare conflitti di routing con Apache in ambienti non SPA.

**Evoluzioni previste**

- In produzione il file PHP caricherà i bundle React da CDN (es. `jsDelivr`) puntando all’ultima versione pubblicata su GitHub.
- La build dovrà essere ottimizzata per il code splitting, in modo da servire più bundle.
- Lo script PHP leggerà una variabile d'ambiente per determinare se usare bundle locali (`/dist/`) o da CDN.
