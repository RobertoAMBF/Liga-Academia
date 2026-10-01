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
- Exclusão de treino lançado errado.
- Registro de água tomada com meta diária calculada por peso e altura.

## Regras de pontos

- Falta: `-1`
- Treino de 30 minutos ou mais: `+3`
- Treino de 60 minutos ou mais: `+4`
- Treino de 120 minutos ou mais: `+5`
- Cada sequência completa de 5 dias treinando: `+5`
- Água tomada igual ou acima da meta diária: `+1`
- Água tomada abaixo da meta diária: `-1`

## Meta de água

A meta diária usa `35 ml por kg` como base e aplica um pequeno ajuste por altura:

- Altura de 180 cm ou mais: `+250 ml`
- Altura de 155 cm ou menos: `-150 ml`
- Meta mínima: `1500 ml`

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
- `supabase/update-water-and-delete.sql`: atualização para projetos que já tinham o schema anterior.
- `.env.example`: variáveis necessárias para local e Vercel.

## Abas do dashboard

No celular, o layout usa uma coluna, abas fixas ao rolar e um seletor de liga acima do conteudo. A classificacao exibe cada atleta com posicao, nome, pontos e todas as estatisticas, sem exigir rolagem horizontal. A tabela completa permanece em telas maiores. Formularios usam campos de 16px para evitar zoom automatico e controles com area de toque de pelo menos 44px; o grupo muscular usa um seletor no celular. Funciona diretamente no navegador, sem instalar um aplicativo.

O botao de tema alterna entre modo claro e escuro em todas as telas, incluindo login e recuperacao de senha. A preferencia fica salva no navegador; na primeira visita, o aplicativo acompanha o tema do sistema. O modo escuro usa fundo grafite, paineis escuros, texto claro e destaques verdes.

- **Liga**: Classificacao, Minhas Ligas, Criar Liga e Entrar por Codigo.
- **Treinos**: Registrar Treino, Historico de Treinos e Perfil e Agua.

A classificacao destaca posicao, pontos, presencas, faltas, minutos, agua e bonus de sequencia. Acima da tabela aparece apenas o contador de atletas.

Em Minhas Ligas, o botao de lixeira permite sair da liga apos confirmar. A liga sai da lista do usuario; os registros de treino continuam no banco. Ao entrar novamente pelo codigo, esses registros voltam a contribuir para sua classificacao.

## Convites por link

Na aba Liga, o botao **Convidar** copia um link da liga ativa, por exemplo `https://liga-da-academia.vercel.app/?invite=ABC123`. O codigo continua disponivel para copiar e entrar manualmente.

Ao abrir o link com uma sessao ativa, o usuario entra na liga automaticamente e ela fica selecionada. Sem sessao, aparece o cadastro; quem ja tem conta pode escolher Entrar. O convite fica salvo no navegador e e aceito depois da autenticacao. Se houver confirmacao de e-mail, o convite tambem acompanha a URL de retorno, inclusive ao abrir o e-mail em outro navegador. Abrir novamente um convite de uma liga da qual ja participa nao duplica a participacao.

Permita as URLs de callback com o parametro de convite em Authentication > URL Configuration > Redirect URLs. Alem das rotas existentes, adicione `https://liga-da-academia.vercel.app/auth/callback?invite=*` e `http://localhost:3000/auth/callback?invite=*` (adapte o dominio se necessario). Solicite um novo e-mail de confirmacao depois de configurar. Nao e necessaria migracao SQL: os convites usam a funcao existente `join_league_by_code`, validada pelo Supabase.

## Grupo muscular treinado

Ao registrar Presenca, o usuario pode escolher uma categoria e selecionar varios musculos:

- **Superiores**: Peito, Biceps, Triceps, Costas e Ombro.
- **Inferiores**: Posterior de Perna, Gluteos, Quadriceps e Panturrilha.
- **Full Body**: todas as opcoes de Superiores e Inferiores.

Os musculos ficam vinculados a data do registro de treino. Ao trocar a categoria, as selecoes que nao pertencem a nova categoria sao removidas. Em Falta, o campo fica desabilitado e o banco limpa as informacoes musculares do registro.

## Historico e exportacao

O historico mostra data, presenca ou falta, duracao, pontos do treino, agua tomada, pontos de agua, grupo muscular e musculos treinados. Pode ser minimizado ou expandido, e cada registro pode ser excluido apos confirmacao.

O painel carrega ate 30 registros criados nas ultimas 24 horas. Essa janela e calculada quando os dados sao carregados: os registros antigos deixam de aparecer no painel, mas continuam no banco e na pontuacao da liga.

Os botoes CSV e TXT exportam os registros carregados da liga ativa. O CSV usa ponto e virgula como separador, UTF-8 com BOM para preservar os acentos no Excel e quebras de linha do Windows; o TXT pode ser aberto no Bloco de Notas. Excluir um treino remove o registro do banco e recalcula a classificacao.

## Atualizar um projeto existente

Para um banco que ja esta em uso, execute os arquivos necessarios no SQL Editor do Supabase, conforme as funcionalidades ainda nao aplicadas:

1. `supabase/update-water-and-delete.sql`: regras de 30/60/120 minutos, perfil, agua, exclusao e classificacao atualizada.
2. `supabase/update-leave-league.sql`: funcao para sair de uma liga.
3. `supabase/update-muscle-history.sql`: campos de grupo muscular e musculos, com limpeza automatica em Falta.

Para um projeto novo, execute `supabase/schema.sql`. Depois de atualizar o banco, envie os arquivos do aplicativo para o GitHub e aguarde o novo deploy da Vercel. Para as ultimas alteracoes de interface, o arquivo principal e `src/app/page.tsx`; mantenha seu caminho ao substituir no repositorio.

## Configuracao de autenticacao

### Confirmacao obrigatoria de e-mail

No painel Supabase, abra Authentication > Sign In / Providers > Email, ative **Confirm email** e salve. Essa configuracao no servidor exige a confirmacao antes do primeiro login; alterar apenas a interface nao protege a API publica. Contas que ja foram confirmadas, inclusive automaticamente quando essa opcao estava desligada, nao passam a exigir nova confirmacao.

Depois do cadastro, a tela pede para verificar a caixa de entrada e o spam. O botao Reenviar confirmacao envia outro link e tem uma espera de 60 segundos; os limites reais continuam sendo impostos pelo Supabase. No login, um e-mail nao confirmado abre a mesma etapa. Os convites de liga continuam sendo preservados ate a confirmacao.

Mantenha as URLs de `/auth/callback` e de convite permitidas em Redirect URLs. O template de confirmacao deve usar o link de confirmacao fornecido pelo Supabase, normalmente `{{ .ConfirmationURL }}`, para validar a conta antes de voltar ao site. Para enviar e-mails a todos os amigos, configure um provedor SMTP proprio; o envio padrao do Supabase tem restricoes e limites baixos.

A confirmacao verifica o acesso ao e-mail, mas nao impede bots de tentar criar cadastros pendentes ou usar e-mails que controlam. Para protecao adicional, configure CAPTCHA (Turnstile ou hCaptcha) no Supabase e integre o widget no aplicativo antes de ativar a exigencia, enviando `captchaToken` nas chamadas de autenticacao. O aplicativo ainda nao integra CAPTCHA; ativa-lo agora no painel pode bloquear cadastro, login e recuperacao de senha. Nao e necessaria migracao SQL para exigir confirmacao de e-mail.

A tela de login inclui **Esqueci minha senha**. Informe o e-mail, abra o link enviado pelo Supabase e preencha a nova senha e sua confirmacao. A pagina `/auth/reset-password` valida a sessao, informa links expirados e atualiza a senha pelo Supabase Auth.

Se um link de recuperacao retornar para a pagina inicial ou `/auth/callback`, o aplicativo reconhece `type=recovery` ou o evento `PASSWORD_RECOVERY` e abre a tela de nova senha. Confirme que a URL de recuperacao esta permitida no Supabase antes de pedir um novo e-mail. Links antigos mantem o destino com que foram enviados.

Em Authentication > URL Configuration > Redirect URLs, adicione tambem:

```text
http://localhost:3000/auth/reset-password
https://liga-da-academia.vercel.app/auth/reset-password
```

Se usar outro dominio, adicione a mesma rota nesse dominio. O envio depende do servico de e-mail configurado no Supabase e dos limites desse servico. Nao e necessario executar uma migracao SQL para recuperar senhas.

Use a URL base do projeto Supabase, sem `/rest/v1/`. A chave deve ser a publica do mesmo projeto (publishable ou anon), nunca a secret ou service_role. Na Vercel, crie duas variaveis separadas: nome em Key e apenas o valor em Value. Alteracoes de variaveis publicas exigem um novo deploy.

Configure Site URL com a URL principal do aplicativo e inclua `/auth/callback` nas URLs de redirecionamento permitidas. Para uso local, inclua `http://localhost:3000/auth/callback`; para producao, inclua `https://SEU-DOMINIO/auth/callback`.

No PowerShell, caso `npm.ps1` seja bloqueado, use `npm.cmd install` e `npm.cmd run dev`. O arquivo `.env.local` deve permanecer local e nao deve ser enviado ao GitHub.

## Observações

O cálculo de pontos por treino é protegido por trigger no banco. Mesmo que o cliente envie um valor diferente, o Supabase recalcula antes de salvar.
