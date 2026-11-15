# Arquitetura técnica da SANTINO

Auditoria inicial: 14/11/2026. Este documento registra o estado observado e a arquitetura proposta; não autoriza mudanças comerciais nem aplicação de migrations.

## Estado observado

- A aplicação é um site estático de várias páginas hospedado no GitHub Pages. O catálogo, as páginas de detalhes, os kits, a busca e o carrinho estão distribuídos em HTML e JavaScript.
- O carrinho é mantido no localStorage do navegador. A finalização atual prepara um pedido para o WhatsApp; não há criação de pedidos no banco nem integração de pagamentos.
- Os dados comerciais aparecem em mais de uma página. A sincronização dos dados entre páginas permanece necessária até que haja uma fonte central validada.
- A busca grava o termo digitado no endpoint REST de `pesquisas_santino` usando uma chave publicável no navegador.
- `produto.html` contém uma URL pública de Supabase Storage que aponta para outro project ref.
- O artefato do Pages agora aceita apenas formatos estáticos e `robots.txt`, omitindo `supabase/`, documentação e pastas de desenvolvimento. O empacotador anterior copiava `CATALOGO.md` e `LEIA-ME.txt` junto com os arquivos visíveis da raiz.

## Modelo atual do catálogo

- `decants.html` e `kits.html` repetem a identidade de fragrâncias (ID, nome, marca, imagem e descrição curta) e definem preços por volume; a lista de detalhes em `produto.html` mantém outra representação dos mesmos produtos.
- `frascos.html` e `produto.html` representam apresentações de frasco por volume e preço; o detalhe suporta uma ou várias apresentações e preço sob consulta.
- `kits.html` define kits como grupos de IDs de produtos, sem preço fixo próprio. A pessoa escolhe volume de 5 ou 10 ml e quantidade de 1 a 5 para cada componente; o total é a soma das variantes escolhidas.
- O modelo futuro precisa manter produtos canônicos, variantes vendáveis, definições/componentes de kit e snapshots de cada variante e quantidade no pedido. Nenhum registro comercial foi importado ou alterado nesta etapa.

## Identidade e auditoria do Supabase

- O Supabase MCP confirmou o projeto **Santino Nobre**, ref `optloyhbkkrptuwsizrc`, na organização Santino, região `us-east-1`, status `ACTIVE_HEALTHY`, PostgreSQL 17.
- O projeto acidental `santino-commerce`, ref `ufopdavfklzqfsqkhhxe`, continua fora de uso e não foi alterado nem excluído.
- A auditoria encontrou a tabela `public.pesquisas_santino`, pertencente a `postgres`, com RLS ativado e `FORCE ROW LEVEL SECURITY` desativado. Colunas: `id bigint GENERATED ALWAYS AS IDENTITY NOT NULL`, `termo text NOT NULL` e `pesquisado_em timestamptz NOT NULL DEFAULT now()`. A única restrição e índice são a chave primária em `id`; não há triggers próprios nem outras restrições.
- O resumo da tabela estimou 0 linhas, mas um `COUNT(*)` somente de leitura confirmou **6 registros**. Nenhum termo armazenado foi lido.
- Existe uma política permissiva para `anon INSERT`; ela só permite termos com tamanho após `trim` entre 1 e 100 caracteres. A auditoria não encontrou leitura, atualização ou exclusão para `anon`/`authenticated`, nem privilégios diretos para `service_role`.
- O histórico do Supabase não contém migrations, embora a tabela exista. O repositório contém somente `supabase/README.md`, sem migrations versionadas; a origem do schema ainda não está registrada.
- Não há Edge Functions nem funções de aplicação no schema `public`. Os advisors de segurança, desempenho e saúde não retornaram avisos.
- A configuração de preview do Supabase no GitHub aponta para o ref correto, mas a criação automática de branches de preview está desativada.

## Arquitetura proposta

### Front-end

- Manter o GitHub Pages como vitrine estática, sem segredos no navegador.
- Continuar preservando catálogo, preços, imagens, descontos e identidade visual até autorização explícita para mudanças.
- Tratar valores recebidos do navegador como não confiáveis. O conteúdo do localStorage não deve determinar preço ou total de um pedido.

### Banco e acesso

- Manter migrations versionadas em `supabase/migrations` e fora do artefato público do Pages.
- Preparar e revisar uma baseline do schema remoto antes de propor a primeira migration. Não recriar, truncar ou modificar `pesquisas_santino` nem seus 6 registros.
- Criar estruturas novas e aditivas para catálogo, variantes, pedidos e itens de pedido. Cada item de pedido deverá guardar snapshots dos dados e preços aceitos no momento da criação. Não importar o catálogo atual até validar o mapeamento.
- Permitir leitura pública somente dos campos comerciais aprovados dos produtos ativos. Custos e informações administrativas devem permanecer fora da resposta pública.
- Manter a tabela de pesquisas limitada à inserção anônima já existente, sem leitura pública. Avaliar limites contra abuso e retenção antes de ampliar essa entrada.

### Criação de pedidos e pagamentos

- Implementar a criação de pedidos através de uma Edge Function que valide produtos, variantes, disponibilidade, quantidades e preços no servidor.
- Negar escrita pública direta nas tabelas de pedidos. A função deverá validar entrada, aplicar limites contra abuso e criar os snapshots do pedido.
- Usar estados de pedido sem liquidação financeira, com atendimento manual/WhatsApp enquanto não houver provedor de pagamento aprovado.
- Manter pagamentos reais desligados até autorização explícita. Futuramente, segredos e validação de webhooks ficam apenas no servidor/Supabase.

### Autenticação administrativa

- Adicionar uma área administrativa somente depois de definir os responsáveis e o fluxo de acesso.
- Usar Supabase Auth e autorização explícita para operações administrativas; não usar user metadata editável para decisões de permissão.
- Nunca colocar service_role, chaves secretas ou credenciais de banco no front-end, no repositório ou no artefato do Pages.

## Implantação e validações

- O GitHub Pages publica somente o conteúdo do site. Pastas de desenvolvimento e `supabase/` ficam fora do artefato.
- Antes do primeiro merge de migration, confirmar qual repositório e branch a integração GitHub do Supabase sincroniza.
- Cada alteração de schema deve ser aditiva e revisada. Não usar reset remoto nem modificar `pesquisas_santino`.
- O workflow executa testes Node sem dependências externas e monta o artefato a partir de uma lista de formatos estáticos permitidos; um teste também valida o repositório real.
- A validação local de migrations ainda depende de preparar o Supabase CLI e Docker neste ambiente. Nenhuma migration foi aplicada.

## Riscos de segurança observados

- A chave do front-end tem formato publicável. Isso é compatível com cliente público, mas a segurança depende das permissões e do RLS no projeto correto.
- Qualquer visitante anônimo pode inserir termos de busca de 1 a 100 caracteres. A política impede leitura pública, mas não demonstra proteção contra spam; termos livres também podem conter dados pessoais.
- O texto de busca aparece na URL da navegação. Evitar registrar dados pessoais e não expor esse histórico em logs ou análises desnecessárias.
- O carrinho é editável pelo usuário. O servidor deve recalcular preços, descontos e estoque antes de aceitar qualquer pedido.
- O armazenamento do carrinho pode ser alterado no navegador. Esta PR escapa `key`, `ml` e `qty` antes de inseri-los no markup; os valores comerciais continuam não confiáveis.
- O workflow anterior incluía `CATALOGO.md` e `LEIA-ME.txt` no artefato do Pages. A nova lista permitida os exclui, sem mudar páginas ou dados comerciais.
