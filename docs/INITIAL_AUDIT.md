# StudyFlow — auditoria inicial

Verificação: 29/10/2026. Fonte: arquivos do projeto e tentativa de consulta pelo CLI Lovable.

## Fatos verificados

- Frontend existente em React 19.2, TypeScript, TanStack Start 1.168.60, TanStack Router 1.170.41, TanStack Query 5.101.1 e Tailwind 4.2.1; versões declaradas em `package.json`.
- Scripts disponíveis: `dev`, `build`, `build:dev`, `preview`, `lint`, `format`, `test` e `test:watch`.
- O cliente oficial `@supabase/supabase-js` não está declarado nas dependências. Não existe a pasta gerada `src/integrations/supabase`.
- Os dados principais continuam locais: `storage.ts` lê/grava `studyflow:data` e lê a chave legada `studyflow:data:v1`; `use-study-data.ts` mantém o estado reativo; `repository.ts` implementa as operações.
- Entidades existentes: períodos, matérias, atividades, subtarefas embutidas, sessões, configurações e cronômetro. Modelos em `src/models/types.ts`.
- As rotas incluem painel, períodos, matérias, atividades, calendário, estudo, metas e configurações. Existência da rota não comprova implementação completa.
- `activityProgress` usa média ponderada de 0/50/100 por status. Isso diverge do requisito novo: apenas atividades concluídas devem contribuir para o percentual. Retorna `null` em listas vazias; consumidores precisam de estado vazio explícito.
- O repositório inclui exclusões físicas locais com remoção de descendentes, que precisarão ser revistas para a prioridade nova de arquivamento.
- TanStack Query está disponível no router e no root, mas não é a fonte dos dados de estudo atuais.

## Bloqueio inicial (resolvido após conexão)

Tentativa não destrutiva:

```sh
lovable supabase query "select table_schema, table_name from information_schema.tables where table_schema = 'public' order by table_name"
```

Resultado: `failed_precondition: this project has no Supabase (Lovable Cloud) backend for the requested environment`.

Não há acesso gerenciado via `PGHOST`; não foram encontradas variáveis de URL de banco configuradas na sessão. A lista de conexões de serviços disponível contém GitHub, não um acesso a banco utilizável.

Não foi possível identificar um projeto remoto, consultar tabelas, colunas, índices, constraints, triggers ou RLS. Não foram executadas migrations, nem criadas tabelas, nem alterados dados ou autenticação. Não foi ativado um novo banco, respeitando a proibição do documento.

## Verificação após conexão

Em 29/10/2026, após a conexão externa disponibilizada pelo usuário, a consulta de leitura via integração retornou as tabelas `public.curso`, `public.matricula` e `public.user` no banco `postgres`. Projeto conectado: `fgxdzvlonocddtimkoaw`.

Agora existem `supabase/config.toml` e os clientes gerados em `src/integrations/supabase`. O impedimento anterior descreve apenas a tentativa anterior à conexão, não o estado atual.

Nenhum registro foi lido nesta verificação, somente nomes de tabelas. Nenhuma migration foi aplicada. A conexão foi confirmada; a integração das funcionalidades do StudyFlow ainda não foi implementada.

## Próxima etapa

Inventariar o schema completo do banco agora acessível, reutilizar tabelas compatíveis, registrar arquitetura inicial completa, integrar Auth e persistência, corrigir progresso e validar isolamento e fluxos reais. Nenhuma dessas etapas deve ser descrita como concluída antes de confirmação.

Este registro não substitui a documentação final solicitada: ela depende da auditoria remota e da implementação real. Nenhum teste, lint ou build foi executado nesta etapa exclusivamente documental.
