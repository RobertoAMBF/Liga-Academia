# Liga da Academia

Aplicativo web em Next.js, TypeScript, Tailwind CSS e Supabase para criar ligas de treino entre amigos, registrar presença/falta diária e acompanhar uma classificação estilo Brasileirão.

## Funcionalidades

- Login e cadastro com Supabase Auth.
- Criação de liga/grupo com código de convite.
- Entrada em liga usando código.
- Registro diário de treino com data, presença/falta e tempo.
- Pontuação automática por treino e bônus de sequência.
- Tabela de classificação responsiva.
- Histórico dos últimos treinos do usuário.

## Regras de pontos

- Presença: `+3`
- Falta: `-1`
- Treino com 45 minutos ou mais: `+1`
- Treino com 90 minutos ou mais: `+2`
- Cada sequência completa de 5 dias treinando: `+5`

## Como rodar localmente

1. Instale o Node.js LTS.
2. Crie um projeto gratuito em [Supabase](https://supabase.com/).
3. No Supabase, abra **SQL Editor** e execute `supabase/schema.sql`.
4. Em **Authentication > Providers**, habilite e-mail/senha.
5. Copie `.env.example` para `.env.local` e preencha:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_CHAVE_ANON_PUBLICA
```

6. Instale as dependências e rode o servidor:

```bash
npm install
npm run dev
```

7. Abra [http://localhost:3000](http://localhost:3000).

## Publicar gratuitamente na Vercel

1. Suba a pasta `liga-da-academia` para um repositório no GitHub.
2. Acesse [Vercel](https://vercel.com/), crie uma conta gratuita e clique em **Add New > Project**.
3. Importe o repositório.
4. Em **Environment Variables**, adicione:

```bash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

5. Clique em **Deploy**.
6. No Supabase, vá em **Authentication > URL Configuration** e adicione a URL da Vercel em **Site URL** e em **Redirect URLs**.

## Estrutura principal

- `src/app/page.tsx`: interface, autenticação, ligas, ranking e histórico.
- `src/lib/supabase.ts`: cliente Supabase.
- `supabase/schema.sql`: tabelas, funções, triggers e políticas RLS.
- `.env.example`: variáveis necessárias para local e Vercel.

## Observações

O cálculo de pontos por treino é protegido por trigger no banco. Mesmo que o cliente envie um valor diferente, o Supabase recalcula antes de salvar.
