#!/usr/bin/env bash
source /etc/birdnet/birdnet.conf
my_dir=$HOME/BirdNET-Pi/scripts
FRONTEND_DIR=$HOME/BirdNET-Pi/frontend/dist
set -x
[ -d /etc/caddy ] || mkdir /etc/caddy
if [ -f /etc/caddy/Caddyfile ];then
  cp /etc/caddy/Caddyfile{,.original}
fi
if ! [ -z ${CADDY_PWD} ];then
HASHWORD=$(caddy hash-password --plaintext ${CADDY_PWD})
cat << EOF > /etc/caddy/Caddyfile
http:// ${BIRDNETPI_URL} {
  # API routes -> PHP
  handle /api/* {
    php_fastcgi unix//run/php/php-fpm.sock {
      root $HOME/BirdNET-Pi/scripts
    }
  }

  # Bird recordings browsing
  handle /By_Date/* {
    root * ${EXTRACTED}
    file_server browse
  }
  handle /Charts/* {
    root * ${EXTRACTED}
    file_server browse
  }
  handle /Processed/* {
    basicauth {
      birdnet ${HASHWORD}
    }
    root * ${EXTRACTED}
    file_server browse
  }

  # Protected routes
  basicauth /stream {
    birdnet ${HASHWORD}
  }

  # Live audio stream
  reverse_proxy /stream localhost:8000

  # Legacy PHP pages (optional)
  handle /legacy/* {
    root * $HOME/BirdNET-Pi/homepage
    php_fastcgi unix//run/php/php-fpm.sock
  }

  # React SPA frontend
  handle {
    root * ${FRONTEND_DIR}
    try_files {path} /index.html
    file_server
  }
}
EOF
else
  cat << EOF > /etc/caddy/Caddyfile
http:// ${BIRDNETPI_URL} {
  # API routes -> PHP
  handle /api/* {
    php_fastcgi unix//run/php/php-fpm.sock {
      root $HOME/BirdNET-Pi/scripts
    }
  }

  # Bird recordings browsing
  handle /By_Date/* {
    root * ${EXTRACTED}
    file_server browse
  }
  handle /Charts/* {
    root * ${EXTRACTED}
    file_server browse
  }

  # Live audio stream
  reverse_proxy /stream localhost:8000

  # React SPA frontend
  handle {
    root * ${FRONTEND_DIR}
    try_files {path} /index.html
    file_server
  }
}
EOF
fi

sudo caddy fmt --overwrite /etc/caddy/Caddyfile
sudo systemctl reload caddy
