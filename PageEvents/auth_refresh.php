<?php

require_once dirname(__DIR__, 2) . '/include/dbcommon.php';

header('Content-Type: application/json');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

function respond(int $statusCode, array $payload): void
{
  http_response_code($statusCode);
  echo json_encode($payload, JSON_UNESCAPED_SLASHES);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  respond(405, ['error' => 'Method not allowed']);
}

require_once dirname(__DIR__, 3) . '/utility/Api/PlankApiClient.php';

try {
  $refreshed = (new PlankApiClient())->refresh();

  if (!$refreshed) {
    respond(401, ['error' => 'Unable to refresh API token']);
  }
} catch (Throwable $e) {
  error_log('Unable to refresh Plank API token from statistics app: ' . $e->getMessage());
  respond(401, ['error' => 'Unable to refresh API token']);
}

$token = $_SESSION['api_token'] ?? null;
$tokenExpiration = isset($_SESSION['api_token_expiration']) ? (int) $_SESSION['api_token_expiration'] : null;

if (!$token || ($tokenExpiration && $tokenExpiration <= time())) {
  respond(401, ['error' => 'API token is missing or expired']);
}

respond(200, [
  'jwt' => $token,
  'expiration' => $tokenExpiration,
  'refresh_expiration' => isset($_SESSION['api_refresh_expiration'])
    ? (int) $_SESSION['api_refresh_expiration']
    : null,
  'language' => $_SESSION['language'] ?? null,
]);
