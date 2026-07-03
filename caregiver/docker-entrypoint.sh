#!/bin/sh
set -eu

cat > /usr/share/nginx/html/env.js <<EOF
window.__CARE_COMPANION_ENV__ = {
  EXPO_PUBLIC_API_URL: "${EXPO_PUBLIC_API_URL:-}"
};
EOF

exec "$@"
