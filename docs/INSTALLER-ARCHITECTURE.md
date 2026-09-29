# Installer architecture

## Windows
Setup gráfico via Inno Setup, EULA obrigatório, elevação pelo UAC, token ProdPipes mascarado e Agent como serviço. O aplicativo nunca pede a senha do Windows.

## Linux
Alvos DEB e RPM. O fluxo exige aceite e usa sudo/polkit. A senha do prompt do sistema não é capturada pelo Agent. Serviço via systemd.

## Atualização
Updater separado do executor. Releases devem possuir versão, SHA-256 e assinatura. Somente versões verificadas serão aplicadas, preservando configuração local e permitindo rollback.

## Branding
ProdPipes é o produto principal; Vimaka Sistemas Inteligentes aparece como desenvolvedora. Assets oficiais ficam em assets/.
