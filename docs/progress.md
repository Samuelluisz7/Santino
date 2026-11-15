# Progresso da integração SANTINO

Atualizado em 15/11/2026 (America/Sao_Paulo).

## Concluído

- [x] Auditoria da estrutura do repositório e do fluxo do GitHub Pages.
- [x] Identificação da integração existente de buscas em search.js.
- [x] Verificação e correção dos limites de dados dinâmicos: o termo de busca é exibido como texto; campos do carrinho vindos de localStorage agora são escapados antes de entrar no markup.
- [x] Mapeamento da estrutura atual de produtos, apresentações e composição configurável dos kits, sem alterar dados do catálogo.
- [x] Identificação de referência Supabase Storage usada por uma imagem de produto.
- [x] Confirmação, via Supabase MCP, do projeto Santino Nobre: ref optloyhbkkrptuwsizrc, organização Santino, região us-east-1, status saudável.
- [x] Após a reconexão solicitada, a sessão voltou a listar o Santino Nobre e permitiu conferir tabela, políticas e grants no ref correto.
- [x] Auditoria somente de leitura da tabela public.pesquisas_santino: colunas não nulas, identidade, chave primária, índice, restrições, triggers, RLS e proprietário confirmados.
- [x] O resumo da tabela estimou 0 linhas; a contagem SQL somente de leitura confirmou 6 registros preservados. Nenhum termo foi lido.
- [x] Política encontrada: `Permitir registrar pesquisas`, anon INSERT para termos após trim com 1–100 caracteres. anon não tem leitura/alteração/exclusão; authenticated não tem grants diretos; service_role tem apenas TRUNCATE/REFERENCES/TRIGGER diretos, sem INSERT/SELECT/UPDATE/DELETE.
- [x] Histórico remoto de migrations estava vazio; a primeira baseline local foi gerada pela Supabase CLI, sem aplicação remota.
- [x] Nenhuma Edge Function ou função de aplicação no schema public.
- [x] Advisors de segurança, desempenho e saúde sem avisos.
- [x] Confirmado que o projeto acidental santino-commerce não foi usado nem alterado.
- [x] No painel do projeto, confirmei a conexão GitHub com `Samuelluisz7/Santino` e diretório `.`. `Deploy to production` está desligado, o campo de branch de produção está desabilitado e a criação automática de branches está desligada; nenhum deploy ou preview foi ativado.
- [x] Workflow do Pages publica somente formatos estáticos permitidos e robots.txt; exclui supabase/, documentação, arquivos ocultos e pastas de desenvolvimento.
- [x] Criados testes automáticos do empacotamento, incluindo o repositório real, para impedir vazamento de supabase/, CATALOGO.md, LEIA-ME.txt e arquivos privados.
- [x] Criado scanner de texto para detectar padrões conhecidos de chaves privadas e credenciais de pagamento.
- [x] Workflow executa validações em pull requests e na branch main; somente main/manual publica no Pages.
- [x] Testes locais: 6 aprovados, cobrindo o empacotamento do repositório real e o escape de campos do carrinho.
- [x] PR draft #2 criada; o GitHub Actions run #51 para o commit `699125954382284374cea6d379cae3db32d68a94` passou. A validação executou 9 testes Node, montou o artefato Pages, aplicou a baseline somente a um Postgres descartável do CI e aprovou os 21 testes pgTAP. O deploy do Pages foi ignorado.
- [x] CLI Supabase 3.1.0 obtida da release oficial em pasta temporária; SHA-256 conferido com o digest da release. Nenhuma instalação global foi feita.
- [x] `supabase init` criou a configuração local. A Data API não expõe tabelas novas automaticamente no ambiente local e seeds estão desativados para evitar importações não aprovadas.
- [x] Gerada via CLI a migration `20261115013651_baseline_pesquisas_santino.sql`, idempotente para a tabela existente, com a política de inserção auditada e sem operações de remoção de dados.
- [x] Adicionado workflow de PR para recriar um Postgres local descartável e validar migrations sem credenciais nem conexão remota.
- [x] Adicionado teste pgTAP com 21 verificações de colunas, PK, RLS, grants e aceitação/rejeição de buscas; os inserts de teste ficam em transação com rollback.
- [x] Testes Node após a baseline: 9 aprovados, incluindo a proteção estática da migration/configuração e o artefato do Pages.

## Em andamento

- [ ] Validar no GitHub Actions a reformulação visual da página inicial e dos cartões de perfumes; 13 testes Node passaram localmente, incluindo imagem 4:3 uniforme e preservação da pirâmide olfativa.

- [ ] Depois da revisão, decidir se e qual branch GitHub deverá ser usada para deploy automático do Supabase. A opção está desligada e o campo de branch não está editável; não habilitar nem aplicar migrations remotas nesta etapa.

## Próximas etapas

- [ ] Manter a PR em rascunho e o deploy automático do Supabase desligado; não aplicar migrations remotamente sem autorização explícita.
- [ ] Criar estruturas novas para catálogo, variantes, pedidos e itens, sem importar nem alterar dados comerciais até validar o mapeamento.
- [ ] Implementar criação de pedidos server-side com RLS e Edge Function, mantendo pagamentos reais desativados.
- [ ] Integrar testes de banco e fluxos de pedido antes de considerar cada recurso concluído.

## Restrições preservadas

- Nenhum projeto Supabase foi criado ou excluído nesta etapa.
- A migration baseline existe somente no checkout/branch de trabalho; nenhuma migration foi aplicada ao Supabase remoto.
- A tabela pesquisas_santino e seus 6 registros foram preservados; somente a contagem agregada foi consultada.
- Nenhum preço, catálogo, imagem, desconto ou recurso comercial foi alterado.
- Nenhum pagamento real foi habilitado.
- O GitHub Pages não foi publicado; a PR segue em rascunho.

## Ambiente local

- Git e Node.js estão disponíveis; npm e Docker não estão disponíveis. A CLI Supabase 3.1.0 foi executada de uma pasta temporária com `SUPABASE_HOME` isolado.
- A validação Node passou localmente com 13 testes. O último GitHub Actions concluído (run #51) passou com 9 testes Node e 21 testes pgTAP em um Postgres descartável; esta reformulação aguarda o próximo run. O Postgres remoto não foi alterado.
- O checkout local não está linkado à produção e nenhuma credencial de banco foi armazenada no repositório.

