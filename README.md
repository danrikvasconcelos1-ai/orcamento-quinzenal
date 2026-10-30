# Orçamento Quinzenal

Site privado com login e senha para planejar o orçamento da família por quinzena (dia 15 e fim do mês), com abas Mês, Ano, Gastos fixos, Cartões e Relatório.

- Inter é pago no dia 15 (vence dia 20). Hipercard é pago no fim do mês anterior ao vencimento (dia 09).
- Os dados ficam no banco (Upstash Redis), então aparecem em qualquer aparelho depois do login.
- Sem dependências e sem comandos: o login e a senha ficam em variáveis do Vercel.

## 1. Subir no GitHub (repositório privado)

Crie o repositório em github.com marcando **Private**, e envie a pasta:

```bash
git init
git add .
git commit -m "Orçamento quinzenal"
git branch -M main
git remote add origin git@github.com:SEU-USUARIO/orcamento-quinzenal.git
git push -u origin main
```

## 2. Publicar no Vercel

1. Em vercel.com: **Add New → Project** e importe o repositório privado.
2. Antes do deploy, em **Environment Variables**, crie (nome → valor):

| Nome | Valor |
|---|---|
| `APP_USER_1` | `daniel` |
| `APP_PASS_1` | a senha do Daniel |
| `APP_USER_2` | `karina` (opcional) |
| `APP_PASS_2` | a senha da Karina (opcional) |

   Até 5 pessoas (`APP_USER_3` / `APP_PASS_3`, e assim por diante). Use senhas fortes, de 10 caracteres ou mais.
3. Clique em **Deploy**.
4. Em **Storage** (ou Marketplace) adicione **Upstash Redis** e conecte ao projeto. Isso cria sozinho as variáveis do banco.
5. Em **Deployments**, faça **Redeploy**.

Abra o endereço do projeto, entre com usuário e senha e use a aba Relatório para baixar o CSV do mês.

## Segurança

- A senha fica só nas variáveis do Vercel (visíveis apenas para quem tem acesso ao seu projeto), nunca no código nem no GitHub.
- Sem login, nenhum dado do orçamento é entregue: nem a página, nem a API.
- Sessão em cookie assinado (HttpOnly, Secure, SameSite=Strict), válida por 7 dias. Ao trocar uma senha no Vercel e fazer Redeploy, as sessões antigas deixam de valer.
- Cabeçalhos de segurança e `noindex` em `vercel.json`.
- Opcional: ative **Vercel Authentication** ou regras de firewall/rate limit no painel do Vercel como segunda camada.
- Avançado, opcional: em vez de senha em texto, use `APP_USERS` com hashes (`node scripts/hash.js "senha"`) e `SESSION_SECRET`.

## Testar no seu computador

```bash
# defina as variáveis (veja .env.example) e rode:
node scripts/dev.js    # http://localhost:3000
```

Sem as variáveis do banco, o site funciona e salva só no navegador (aparece o aviso "Banco não configurado").

## Dois usuários ao mesmo tempo

Os dois usam os mesmos dados. Se um salvar enquanto o outro estava com a página aberta, o segundo recebe o aviso "Outra pessoa alterou os dados" e precisa recarregar, para não apagar a edição do outro.
