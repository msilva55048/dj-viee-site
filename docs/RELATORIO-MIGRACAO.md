# Migração real do DJ VIEE para o Supabase

Data: 04/09/2026.

## Resultado

Os dados reais utilizados pela versão atual do DJ VIEE foram transferidos para o Supabase e comparados integralmente com a origem. O site Next.js carregou esses dados no ambiente local, o painel administrativo foi validado contra o Supabase hospedado e o banco original permaneceu somente leitura.

Nenhum commit, push ou deploy foi realizado. Render, banco antigo, DNS e projeto Java continuam ativos e inalterados.

## Banco antigo

- Tecnologia: PostgreSQL.
- Provedor: não identificado com segurança pela configuração disponível. A possibilidade de Neon não foi assumida como fato.
- Credenciais locais encontradas: `DB_URL`, `DB_USERNAME` e `DB_PASSWORD`; os valores não foram exibidos nem copiados para arquivos versionados.
- A conexão impôs `default_transaction_read_only=on` e usou transações `REPEATABLE READ READ ONLY`.
- Tabelas públicas encontradas: `about`, `music`, `events` e `admin_users`. Não foram encontradas tabelas públicas adicionais nem triggers personalizados.

| Tabela | Registros antes da migração |
| --- | ---: |
| `about` | 1 |
| `music` | 7 |
| `events` | 1 |
| `admin_users` | 1 |

Foram inventariados colunas, tipos, limites, nulabilidade, identidades, chaves primárias, unicidade do nome do administrador, índices e estado das sequences. Não existem foreign keys entre as quatro tabelas de conteúdo originais.

## Supabase

Foram aplicadas as migrations:

- `202609040001_initial.sql`: tabelas, identidades, índices, view `featured_music`, RLS, grants e funções administrativas.
- `202609040002_safe_music_update.sql`: torna o deslocamento das músicas compatível com a proteção de updates da API hospedada do Supabase.

Tabelas criadas: `about`, `music`, `events`, `admin_users`, `admin_sessions` e `login_attempts`. A view `featured_music` entrega somente as seis primeiras músicas.

| Tabela migrada | Registros após a importação |
| --- | ---: |
| `about` | 1 |
| `music` | 7 |
| `events` | 1 |
| `admin_users` | 1 |

`admin_sessions` e `login_attempts` são estruturas novas da arquitetura e começaram vazias. Não representam dados descartados da origem.

## Backup e integridade dos dados

Antes das inserções foi criado um snapshot local privado em `migration-private/<data-hora>/snapshot.json`, acompanhado de checksums. A pasta já é ignorada pelo Git. O backup contém dados reais e deve continuar privado.

A importação preservou IDs, todos os campos, nulos, URLs, datas, timestamps, posições, hashes BCrypt e estado seguro das sequences. A comparação calculou SHA-256 sobre todas as colunas de todas as linhas, ordenadas por ID, antes do commit. Uma segunda conexão após o commit repetiu a comparação integral com a origem.

Resultado: 1 biografia, 7 músicas, 1 evento e 1 administrador idênticos entre origem e destino. Não houve transformação ou diferença de conteúdo. A verificação integral inclui os registros do início, meio e fim e é mais forte que amostragem isolada.

## Autenticação e RLS

Supabase Auth não foi adotado. O projeto original usa nome de usuário e hash BCrypt, sem e-mail; o registro e o hash do administrador foram preservados byte a byte. O Next.js valida esse formato, cria sessões opacas server-side e mantém CSRF, revogação e limitação persistente de tentativas.

A senha real não foi lida nem exibida. O login hospedado foi testado com um administrador temporário criado exclusivamente para a homologação e removido ao final. Isso comprova o fluxo com a mesma tabela, hash BCrypt, sessão e handlers usados pelo administrador migrado, sem alterar a credencial real.

RLS foi confirmada nas seis tabelas:

- a chave publicável lê `about`, `events` e os seis itens de `featured_music`;
- a chave publicável não lê `music`, `admin_users`, `admin_sessions` ou `login_attempts`;
- operações administrativas sem sessão são bloqueadas;
- a chave secreta funciona no código server-side e não é enviada ao navegador.

## Aplicação com dados reais

O build de produção foi iniciado localmente com o Supabase hospedado, sem fixtures ou adaptador de banco. O teste confirmou:

- página pública carregando a biografia, agenda e músicas migradas;
- exatamente seis músicas expostas no frontend e sete preservadas no arquivo;
- páginas e escrita administrativa bloqueadas sem sessão;
- login administrativo e acesso ao painel;
- criação de música de teste, entrada na posição 1, manutenção do limite de seis e exclusão com reordenação;
- criação, visualização, edição e exclusão de evento de teste.

Os nomes de teste receberam marcador único. O procedimento removeu somente o administrador, a música, o evento e as sessões temporárias. Ao final, um checksum do conjunto real das quatro tabelas confirmou a restauração exata do conteúdo anterior ao teste.

Não existe edição de música no sistema original; portanto, a versão nova preserva inclusão e exclusão, sem inventar essa funcionalidade.

## Validações finais

| Verificação | Resultado |
| --- | --- |
| Comparação origem × Supabase após commit | 9 registros e todos os campos idênticos |
| API/RLS hospedada | Aprovada; conteúdo público acessível e tabelas privadas bloqueadas |
| Aplicação local com Supabase real | Aprovada |
| CRUD real temporário e restauração | Aprovado |
| `npm run typecheck` | Concluído sem erros |
| `npm run test` | 9 aprovados, 0 falhas |
| `npm run build` | Concluído sem erros com Next.js 16.3.4 |

A suíte também cobre PostgreSQL/RLS, BCrypt, sessões, CSRF, URLs do YouTube, datas, precisão bigint e ausência de módulos privilegiados nos bundles públicos. A validação anterior de interface permanece em 40 comparações visuais sem diferenças detectadas.

## Segurança e estado do projeto

- Banco antigo: intacto, acessado somente para catálogo, exportação e comparação em transações somente leitura.
- Operações destrutivas na origem: nenhuma.
- Secrets, senhas e connection strings em arquivos versionados: nenhum.
- `.env.local`: ignorado pelo Git.
- Backup real: privado e ignorado pelo Git.
- `SUPABASE_SECRET_KEY`: usada somente no servidor e nunca prefixada com `NEXT_PUBLIC_`.
- Commit: **NÃO**.
- Push: **NÃO**.
- Deploy: **NÃO**.

O próximo estágio deve ser tratado separadamente: revisão, commit, push, configuração da Vercel e teste de produção. Nenhum serviço antigo deve ser desligado antes dessa homologação.
