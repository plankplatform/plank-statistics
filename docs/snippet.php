<?php

$token = $_SESSION['api_token'] ?? '';
$cacheBuster = time();

echo '
    <style>

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

  // div root usato da React
  const container = document.createElement("div");
  container.id = "root";
  shadowRoot.appendChild(container);

  // css React
  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = "/plank/plank-statistics/dist/assets/index.css?v=' . $cacheBuster . '";
  shadowRoot.appendChild(css);

  // esponi lo shadow root a React
  window.__SHADOW_ROOT__ = shadowRoot;

  // importa dinamicamente React
  import("/plank/plank-statistics/dist/assets/index.js?v=' . $cacheBuster . '");
</script>
';
