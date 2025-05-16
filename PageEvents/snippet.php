<?php

$token = $_SESSION['api_token'] ?? '';
$cacheBuster = time();

require_once dirname(__DIR__, 3) . '/utility/config/config.php';

echo '
  <style>
    html, body {
      margin: 0;
      padding: 0;
      height: 100%;
      width: 100%;
      overflow: hidden;
    }

    .r-topbar-page {
      background-color: white;
    }

    #iframe-host {
      width: 100%;
      height: 100vh;
      border: none;
      display: block;
      scrollbar-width: none;
    }

    #iframe-host::-webkit-scrollbar {
      display: none;
    }

    #footer:not(#react-wrapper > #footer) {
      display: none !important;
    }
  </style>

  <script>
    const token = ' . json_encode($token) . ';
    sessionStorage.setItem("apitoken", token);
  </script>
';

if(APP_ENV === 'prod') {
  echo '
    <iframe
      id="iframe-host"
      src="/plank/PageEvents/plank_statistics_dashboard/index.html?v=' . $cacheBuster . '"
    ></iframe>
  ';
} else {
  echo '
    <iframe
      id="iframe-host"
      src="/plank/plank-statistics/dist/index.html?v=' . $cacheBuster . '"
    ></iframe>
  ';
}
