# Progresso da integração SANTINO

Atualizado em 14/11/2026.

## Concluído

- [x] Auditoria da estrutura do repositório e do fluxo do GitHub Pages.
- [x] Identificação da integração existente de buscas em search.js.
- [x] Verificação dos limites de dados dinâmicos: o termo de busca é exibido como texto; a renderização do carrinho usa alguns campos não escapados de localStorage em innerHTML.
- [x] Identificação de referência Supabase Storage usada por uma imagem de produto.
- [x] Auditoria somente de leitura do projeto Supabase acessível nesta sessão.
- [x] Confirmado que a conexão atual expõe santino-commerce (ufopdavfklzqfsqkhhxe), que o usuário marcou como projeto acidental e proibiu usar ou excluir.
- [x] Confirmado que essa conexão retorna zero tabelas, migrations e Edge Functions; isso não é o estado do projeto Santino Nobre.
- [x] Project Ref optloyhbkkrptuwsizrc confirmado pela integração Supabase Preview do GitHub na PR #2, consistente com o endpoint de buscas no código. O check do GitHub liga ao painel de integrações desse projeto.
- [x] Confirmado que a criação de branches Supabase de preview por PR está desativada; nenhum preview de banco foi criado.
- [x] Workflow do Pages publica somente formatos estáticos permitidos e robots.txt; exclui supabase/, documentação, arquivos ocultos e pastas de desenvolvimento.
- [x] Criados testes automáticos do empacotamento, incluindo o repositório real, para impedir vazamento de supabase/, CATALOGO.md, LEIA-ME.txt e arquivos privados.
- [x] Criado scanner de texto para detectar padrões conhecidos de chaves privadas e credenciais de pagamento.
- [x] Workflow executa validações em pull requests e na branch main; somente main/manual publica no Pages.
- [x] Testes locais: 4 aprovados; a montagem do repositório real inclui as páginas e omite CATALOGO.md, LEIA-ME.txt e supabase/.
- [x] PR draft #2 criada; a validação GitHub Actions passou e o deploy do GitHub Pages foi ignorado para PR. O Netlify criou um deploy preview automático; o check informa zero páginas geradas e quatro assets alterados.

## Em andamento

- [ ] Reconectar o painel administrativo/MCP do Supabase ao ref optloyhbkkrptuwsizrc. A lista de projetos desta sessão ainda só mostra santino-commerce; a tela do Supabase exige login do usuário.
- [ ] Confirmar no painel o nome Santino Nobre e qual branch a integração GitHub sincroniza.
- [ ] Inspecionar apenas por leitura schema, RLS, políticas e histórico de pesquisas_santino no projeto correto.

## Próximas etapas após confirmação

- [ ] Preparar a baseline de migrations a partir do schema remoto, revisar cuidadosamente o diff e preservar pesquisas_santino e todos os registros.
- [ ] Validar migrations localmente antes de qualquer sincronização.
- [ ] Criar estruturas novas para catálogo, variantes, pedidos e itens, sem importar nem alterar dados comerciais até validar o mapeamento.
- [ ] Implementar criação de pedidos server-side com RLS e Edge Function, mantendo pagamentos reais desativados.
- [ ] Integrar testes de banco e fluxos de pedido antes de considerar cada recurso concluído.

## Restrições preservadas

- Nenhum projeto Supabase foi criado ou excluído nesta etapa.
- Nenhuma migration foi aplicada.
- Nenhuma tabela ou registro foi alterado; pesquisas_santino permanece sem modificações.
- Nenhum preço, catálogo, imagem, desconto ou recurso comercial foi alterado.
- Nenhum pagamento real foi habilitado.

## Ambiente local

- Git e Node.js estão disponíveis; npm, Supabase CLI e Docker não estão disponíveis.
- A validação local do schema ainda não foi executada.
- A validação Node do empacotamento é independente do banco.

