# DJ VIEE — Next.js + Supabase

Migração técnica da aplicação Spring Boot, mantendo o site e o painel administrativo. A aplicação nova fica na raiz deste diretório `site/`. Os arquivos Java e os templates originais em `src/main` continuam intactos para referência e reversão. Eles não participam do build Next.js.

## Executar

Node.js 22 ou 24 LTS. Na pasta `site`:

```sh
npm install
npm run build
```

O build não precisa de conexão ao banco. Para abrir o site e operar o painel, copie `.env.example` para `.env.local` e configure o Supabase. Depois execute `npm run dev` ou, após o build, `npm start`. Dados de demonstração não são carregados pela aplicação.

## Variáveis

| Nome | Uso | Vercel |
| --- | --- | --- |
| SUPABASE_URL | URL do novo projeto Supabase | Sim |
| SUPABASE_PUBLISHABLE_KEY | Chave publicável do projeto; aceita a antiga chave anon | Sim |
| SUPABASE_SECRET_KEY | Chave privilegiada usada somente no servidor, após autenticação administrativa | Sim, segredo |
| SITE_URL | Origem exata da aplicação, com protocolo e sem caminho, usada na validação de origem | Sim; separar Preview e Production |
| LEGACY_DATABASE_URL | Conexão PostgreSQL original, apenas para inspeção/transferência local | Não |
| SUPABASE_DATABASE_URL | Conexão PostgreSQL do destino para criação do esquema e transferência local | Não |

Não usar prefixo `NEXT_PUBLIC_` na `SUPABASE_SECRET_KEY`. Não enviar `.env.local`, dumps ou backups ao Git. A chave publicável é usada pelo servidor para leituras públicas sob RLS; o navegador não precisa conversar diretamente com o Supabase.

## Configurar Supabase e transferir dados

1. Criar um projeto Supabase dedicado. Aplicar `supabase/migrations/202609040001_initial.sql` no SQL Editor **do destino**. O script foi feito para banco novo e falha se as tabelas já existirem; não reutilizar no banco antigo.
2. Preencher as variáveis locais com conexões apropriadas. Para scripts, usar conexão direta ou pooler em modo sessão; TLS conforme a configuração do provedor, sem desligar a verificação de certificado. A origem deve preferencialmente utilizar um usuário somente leitura.
3. Executar `npm run db:inspect`. A conexão original já solicita `default_transaction_read_only=on` e usa uma transação `REPEATABLE READ READ ONLY`. O relatório mostra esquema, constraints e contagens, sem credenciais ou hashes de senha.
4. Conferir o catálogo real contra `docs/AUDITORIA.md`. O script interrompe se encontrar outras tabelas/colunas ou se os tipos/nullability diferirem entre origem e destino. Revisar também constraints, índices, triggers e personalizações do banco original antes de continuar.
5. Suspender temporariamente edições administrativas no site antigo durante a cópia e a validação final. O snapshot é consistente, mas alterações feitas depois dele não estarão na cópia. O script não modifica nem bloqueia administrativamente o site antigo.
6. Executar `npm run db:migrate`. O destino deve estar vazio nas quatro tabelas originais. O script cria um backup local privado em `migration-private/`, preserva IDs, nulos, timestamps com microssegundos, senhas BCrypt e todas as colunas (inclusive `ticket_url`). Compara SHA-256 de todos os registros/colunas antes de confirmar a transação do destino e restaura as sequências de IDs. Falha de comparação provoca rollback dos registros do destino. Sequências PostgreSQL não são transacionais; uma falha perto do commit pode avançá-las, sem eliminar registros.
7. Executar `node --env-file-if-exists=.env.local scripts/migrate-data.mjs verify` enquanto as edições antigas permanecem suspensas. A verificação compara novamente os dados das duas conexões sem gravar registros.
8. Validar o login existente, o conteúdo real e as operações administrativas no novo projeto. Guardar backup em armazenamento privado antes de qualquer futura retirada do Render.

O script não apaga/sobrescreve registros para permitir uma segunda execução. Se o destino já tiver dados, deve-se investigar e decidir conscientemente como proceder. Nunca inserir amostras no destino usado para migração.

## Administração e segurança

O login permanece em `/login`, por nome de usuário e senha. As contas de `admin_users` são transferidas com o BCrypt existente; nenhuma senha precisa ser revelada ou redefinida. Não existe cadastro público ou criação automática de novos administradores. Um administrador na origem continuará sendo um no destino; se houver mais, todos são preservados. Não foi escolhido Supabase Auth porque a origem não tem e-mails e já possui credenciais compatíveis com verificação segura no servidor.

As sessões são tokens aleatórios de 256 bits; somente SHA-256 é armazenado em `admin_sessions`. Cookies são HttpOnly/SameSite=Lax e, em produção, Secure com prefixo `__Host-`, duração de oito horas. Logout revoga a sessão no banco. Troca de senha verifica a senha atual, mantém as regras anteriores, invalida todas as sessões antigas e emite uma nova. As tentativas de login são limitadas por conta no banco, sem depender da memória de uma função Vercel.

POSTs exigem token CSRF, conferência da origem e sessão administrativa. A API de eventos exige o mesmo para escrita, via `X-CSRF-Token`. GET de `/logout` apenas apresenta a confirmação original; somente POST encerra sessão. Respostas administrativas não são armazenadas em cache.

Todas as tabelas têm RLS habilitado. `anon`/`authenticated` podem ler `about`, `events` e a projeção `featured_music`, limitada às seis primeiras músicas. A tabela `music` completa e todas as tabelas de conta/sessão permanecem inacessíveis a esses papéis. A view pública usa o proprietário deliberadamente para expor apenas essa projeção limitada; não dá permissão de escrita ou de leitura do arquivo completo. As funções de alteração são executáveis somente por `service_role`, utilizada exclusivamente após autenticação no backend Next.js. Usuários do Supabase Auth não ganham privilégios administrativos por estarem autenticados.

Não há músicas embutidas no código. O padrão de biografia é copiado literalmente de `AboutService` e só é usado quando a leitura do banco confirma ausência de registro. Falha de conexão não é transformada silenciosamente em lista vazia ou conteúdo de exemplo.

## Vercel — configurar somente após validação

Framework Preset: **Next.js**. Root Directory: diretório que contém este `package.json` (raiz do repositório Git atual; `site` é a pasta local). Install Command: `npm install`; Build Command: `npm run build`; Output Directory: padrão Next.js. Selecionar Node.js 24.x ou 22.x. Cadastrar as quatro variáveis indicadas para Vercel. Preview deve utilizar origem e banco próprios se for permitir testes de edição.

Não selecionar o Dockerfile antigo, Maven, Render ou Java. `npm start` é apenas para teste local; a Vercel executa as páginas e endpoints do Next.js. Não houve commit, push ou deploy nesta migração.

## Testes e limites

```sh
npm test
npm run typecheck
npm run build
node --import tsx scripts/integration-check.ts
```

Os testes de banco executam SQL real em PostgreSQL/WASM (PGlite), com papéis anon/authenticated/service_role. A integração executa o Next.js de produção contra um adaptador PostgREST local respaldado por esse banco. Isso valida aplicação e SQL, mas não substitui a homologação do PostgREST/RLS na instância Supabase real.

Para comparação visual no Windows, com dependências Maven originais em `%USERPROFILE%/.m2` e Chrome instalado:

```powershell
./scripts/render-legacy.ps1
npm run test:visual
```

O primeiro comando renderiza os seis templates com Thymeleaf/Spring Security, sem iniciar Spring Boot ou conectar a banco. O segundo compara com o Next.js nas larguras 390, 768 e 1440px, incluindo estados vazio/preenchido, login/logout e menu mobile. Os registros artificiais existem somente no banco efêmero de testes; nunca entram no projeto Supabase ou na aplicação normal. Miniaturas YouTube são bloqueadas igualmente nos dois lados; disponibilidade de mídia remota exige validação com os links reais. Imagens locais e CSS são os mesmos arquivos originais.

Resultados e imagens ficam em `test-results/`, ignorado pelo Git. Consulte `docs/RELATORIO-MIGRACAO.md` para o resultado efetivamente obtido e pendências. A migração completa dos dados e a aceitação final dependem de acesso à origem e ao destino.

## Referências

Renderização e código de servidor: https://nextjs.org/docs/pages/building-your-application/data-fetching/get-server-side-props . Políticas de dados: https://supabase.com/docs/guides/database/postgres/row-level-security . Atribuições da tela padrão de login: `docs/THIRD-PARTY-NOTICES.md`.
