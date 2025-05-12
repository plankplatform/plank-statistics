<?php

$token = $_SESSION['api_token'] ?? '';
$cacheBuster = time();

echo '
  <style>
    html, body {
      margin: 0;
      padding: 0;
      height: 100%;
      width: 100%;
    }

    #iframe-host {
      width: 100%;
      height: 100vh;
      border: none;
      display: block;
    }

    #footer:not(#react-wrapper > #footer) {
      display: none !important;
    }
  </style>

  <script>
    const token = ' . json_encode($token) . ';
    sessionStorage.setItem("apitoken", token);
  </script>

  <iframe
    id="iframe-host"
    src="/plank/plank-statistics/dist/index.html?v=' . $cacheBuster . '"
  ></iframe>
';
