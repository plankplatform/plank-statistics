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
