# Contas da Casa

App (PWA) de gestão financeira da casa, partilhada entre o Vitor e a Ana Carina.

- **App:** https://vitordleite.github.io/contas-casa/
- **Dados:** Firebase (projeto `contas-casa-d3777`, Firestore em eur3) — só `vitordiasleite@gmail.com` e `carinalestre@gmail.com` têm acesso (ver `firestore.rules`).
- **Contas:** criadas em Firebase → Authentication → Usuários.

## Ficheiros
| Ficheiro | O que é |
|---|---|
| `index.html` | Estrutura e estilos |
| `app.js` | Lógica da app (categorias, cálculos, ecrãs) |
| `firebase.js` | SDK do Firebase 13.2.0 (empacotado, não editar) |
| `config.js` | Configuração pública do projeto Firebase |
| `sw.js` | Service worker (funcionamento offline) |
| `manifest.webmanifest`, `icons/` | Ícone e instalação no telemóvel |
| `firestore.rules` | Cópia das regras de segurança publicadas no Firebase |

## Publicar uma versão nova
1. Alterar os ficheiros.
2. Em `sw.js`, subir o número em `VERSAO` (ex.: `contas-v1.0.1`).
3. Fazer commit no GitHub — o GitHub Pages publica em ~1 minuto e a app mostra "Há uma nova versão".

## Acrescentar/alterar quem tem acesso
Editar a lista de e-mails em Firebase → Firestore → Regras (e manter `firestore.rules` igual) e criar a conta em Authentication.
