# ProdPipes Test Agent — Termo de Aceite

Copyright © 2026 Vimaka Sistemas Inteligentes.

Ao instalar o ProdPipes Test Agent, o usuário autoriza expressamente a instalação e a execução local do agente e dos componentes selecionados no assistente.

O agente pode executar testes automatizados em ambientes locais suportados, coletar logs técnicos e resultados dos testes e enviá-los ao serviço ProdPipes configurado pelo usuário.

O instalador deve mostrar este termo antes da instalação e exigir aceite explícito. A recusa encerra o setup.

## Privilégios do sistema
Operações administrativas usam exclusivamente UAC/sudo/polkit. O agente não coleta, armazena nem transmite a senha do sistema operacional.

## Dados e credenciais
Tokens ProdPipes devem ser protegidos localmente. Segredos não devem aparecer em logs. O usuário pode remover o agente e suas credenciais.

## Terceiros
Android SDK, Appium, WSL, virtualizadores, Xcode e outros componentes possuem seus próprios termos.

## Código aberto
O agente é disponibilizado sob Apache-2.0.
