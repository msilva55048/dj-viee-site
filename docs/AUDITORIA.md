# Auditoria anterior à migração — 04/09/2026

O repositório está em `site/`, sem alterações locais iniciais. Não foram encontrados AGENTS.md, hospedagem Sites, dumps, seeds de músicas/eventos ou credenciais de banco no ambiente. As propriedades usam DB_URL, DB_USERNAME e DB_PASSWORD. Nenhuma conexão ao banco original foi realizada. O esquema abaixo é inferido das entidades JPA; o catálogo real deve ser conferido antes da transferência.

## Arquitetura e inventário

Java 21, Spring Boot 4.1.0, MVC, Thymeleaf, Spring Security, JPA/Hibernate, PostgreSQL, Maven Wrapper e Docker para Render. Hibernate utiliza ddl-auto=update; não existem migrations versionadas. Há apenas um teste de carregamento de contexto, dependente de banco.

Foram lidos os três controllers, quatro services, quatro repositories, quatro entidades, duas configurações de segurança, application.properties, pom.xml, Dockerfile, teste, seis templates completos, CSS e JavaScript. Assets: dois PNGs em static/imagem. Fonte Arial/Helvetica/sans-serif, ícone WhatsApp em SVG inline, sem fonte externa, favicon, sitemap, robots ou Open Graph próprios. Breakpoints públicos: 1050, 950, 850 e 500px; administrativos: 700/750px. Cada tela administrativa tem seu próprio CSS inline.

## Rotas e comportamento

| Rota | Comportamento |
| --- | --- |
| GET / | Uma página com #inicio, #sobre, #musicas, #agenda e #contato |
| PressKit | Link Dropbox existente; não é página local |
| Contrate | WhatsApp com telefone e mensagem existentes; Instagram; nenhum formulário público |
| GET /admin | Dashboard com quatro cartões |
| GET/POST /admin/sobre | Três parágrafos, data de atualização, mensagem de sucesso |
| GET/POST /admin/musicas | Lista completa e cadastro; sem edição implementada apesar do texto do dashboard |
| POST /admin/musicas/excluir | Exclui registro e compacta posições |
| GET/POST /admin/eventos | Lista e criação de evento |
| POST /admin/eventos/editar e /excluir | Edição e exclusão com confirmação |
| GET /admin/conta e POST /admin/conta/senha | Usuário atual, senha atual, nova senha, confirmação |
| GET/POST /login, GET/POST /logout | Telas geradas pelo Spring Security, sem template customizado |
| GET/POST /api/events e DELETE /api/events/{id} | JSON camelCase; API pública de leitura. As escritas não exigiam administrador explicitamente na configuração; a migração deve protegê-las conforme solicitação |

Título público DJ VIEE e descrição SEO preservados. Menu usa scroll suave e marca seção atual considerando altura da barra. Botão WhatsApp muda para círculo no celular. Músicas abrem YouTube e usam miniaturas hqdefault, sem player/iframe no código. Links externos mantidos literalmente, sem acesso aos arquivos do PressKit.

## Banco inferido

Todas as PKs são bigint identity; não há relacionamentos declarados entre as quatro tabelas.

* about: id; paragraph_1/2/3 text NOT NULL; updated_at timestamp NOT NULL. getAbout retorna primeiro registro; banco vazio recebe três textos reais do AboutService. Não há garantia SQL de singleton.
* music: id; title varchar(180), artists varchar(220), youtube_url varchar(500), youtube_video_id varchar(30), position integer, created_at timestamp — todos NOT NULL. Lista ordenada por position ASC; público limitado a seis. Inserção desloca todas as posições, preservando músicas fora das seis primeiras. Exclusão renumera a partir de 1. Novo código deve executar essas mudanças em transação com trava para concorrência.
* events: id; title, city, location, ticket_url varchar(255); event_date date; description varchar(1000). Colunas opcionais no modelo. ticketUrl existe na API/banco, embora não apareça no formulário. findAll não define ordenação; nova leitura usa id para resultado estável, sem filtrar passado/futuro.
* admin_users: id; username varchar(100) UNIQUE NOT NULL; password varchar(100) NOT NULL (BCrypt); created_at/updated_at timestamp NOT NULL. Todos os registros dessa tabela são administradores. Não há cadastro público. Criação inicial dependia de variáveis de ambiente. A quantidade real de administradores é desconhecida.

## Validações e mensagens

Campos obrigatórios e limites dos formulários preservados. YouTube aceita watch?v=, embed/, shorts/ e youtu.be com identificador de 11 caracteres. Campos de música/evento são aparados; biografia não é aparada. Descrição ausente vira string vazia. Alteração de senha exige senha atual correta, mínimo 8 caracteres, confirmação igual e senha diferente. Mensagens em português permanecem iguais. Não existem músicas reais nos templates: textos de fallback Thymeleaf não são dados cadastrados.

## Decisões de migração

Next.js/TypeScript com páginas React renderizadas no servidor, mantendo URLs de formulários. Supabase PostgreSQL e API server-side. Autenticação por username/BCrypt preserva credenciais sem inventar e-mails ou recadastrar usuários; Supabase Auth não é necessário para este modelo. Sessões opacas revogáveis, cookies HttpOnly/SameSite, CSRF e limite de tentativas persistente. RLS em todas as tabelas; leitura pública somente do conteúdo; demais operações exclusivamente no servidor após autorização. Nenhuma senha ou chave privilegiada em props de páginas.

## Limites desta auditoria

Sem credenciais, não é possível afirmar quantidade/conteúdo dos registros, identidade visual dos dados atuais, catálogo real, versões de PostgreSQL ou resultado de RLS no projeto Supabase hospedado. Isso exige inspeção somente leitura e transferência verificada. Não executar a aplicação Java apontando para produção, pois ddl-auto=update e inicializadores podem escrever no banco.
