<?php

require_once dirname(__DIR__, 3) . '/utility/config/config.php';

$cacheBuster = time();
$currentVersion = '1.2.9';

if (APP_ENV != 'local') {
  require_once dirname(__DIR__, 3) . '/utility/Api/PlankApiClient.php';

  try {
    (new PlankApiClient())->refreshIfNeeded();
  } catch (Throwable $e) {
    error_log('Unable to refresh Plank API token before loading statistics app: ' . $e->getMessage());
  }
}

$token = $_SESSION['api_token'] ?? '';
$tokenExpiration = isset($_SESSION['api_token_expiration']) ? (int) $_SESSION['api_token_expiration'] : null;
$refreshExpiration = isset($_SESSION['api_refresh_expiration']) ? (int) $_SESSION['api_refresh_expiration'] : null;
$language = $_SESSION['language'] ?? 'boh';
$refreshUrl = APP_ENV === 'prod'
  ? '/plank/PageEvents/plank_statistics_dashboard/auth_refresh.php'
  : '/plank/plank-statistics/PageEvents/auth_refresh.php';

$bootstrap = [
  'token' => $token,
  'tokenExpiration' => $tokenExpiration,
  'refreshExpiration' => $refreshExpiration,
  'language' => $language,
  'refreshUrl' => $refreshUrl,
];

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
    const plankAuth = ' . json_encode($bootstrap, JSON_UNESCAPED_SLASHES) . ';

    sessionStorage.setItem("apitoken", plankAuth.token || "");
    sessionStorage.setItem("language", plankAuth.language || "English");
    sessionStorage.setItem("api_auth_refresh_url", plankAuth.refreshUrl);

    if (plankAuth.tokenExpiration) {
      sessionStorage.setItem("apitoken_expiration", String(plankAuth.tokenExpiration));
    } else {
      sessionStorage.removeItem("apitoken_expiration");
    }

    if (plankAuth.refreshExpiration) {
      sessionStorage.setItem("api_refresh_expiration", String(plankAuth.refreshExpiration));
    } else {
      sessionStorage.removeItem("api_refresh_expiration");
    }
  </script>
';

echo "
  <script>
    window.addEventListener('message', function (event) {
      if (event.data && event.data.type === 'externalClick') {
        document.body.click();
      }
    });
  </script>
";

if(APP_ENV === 'prod') {
  echo '
    <iframe
      id="iframe-host"
      src="/plank/PageEvents/plank_statistics_dashboard/index.html?v=' . $currentVersion . '"
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
