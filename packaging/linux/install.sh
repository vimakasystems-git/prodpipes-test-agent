#!/usr/bin/env bash
set -euo pipefail
if [ "$(id -u)" -eq 0 ]; then echo "Execute como usuário normal; sudo será solicitado quando necessário."; exit 1; fi
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
echo "ProdPipes Test Agent - Vimaka Sistemas Inteligentes"
cat "$ROOT/docs/EULA.md"
read -r -p "Digite ACEITO para aceitar o termo e continuar: " ACCEPT
[ "$ACCEPT" = "ACEITO" ] || { echo "Instalação cancelada."; exit 2; }
read -r -s -p "Token de registro do ProdPipes: " TOKEN; echo
[ -n "$TOKEN" ] || { echo "Token obrigatório."; exit 3; }
echo "Privilégios administrativos serão solicitados pelo sudo do sistema."
sudo -v
sudo install -d -m 0755 /opt/prodpipes-agent
sudo cp -R "$ROOT/src" "$ROOT/package.json" /opt/prodpipes-agent/
sudo sh -c "printf '%s\n' 'PRODPIPES_API_URL=https://prodpipes.com' 'PRODPIPES_AGENT_TOKEN=$TOKEN' > /opt/prodpipes-agent/.env"
sudo chmod 600 /opt/prodpipes-agent/.env
sudo cp "$ROOT/packaging/linux/prodpipes-agent.service" /etc/systemd/system/prodpipes-agent.service
sudo systemctl daemon-reload
sudo systemctl enable --now prodpipes-agent.service
echo "ProdPipes Test Agent instalado."
