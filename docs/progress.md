# Progresso da integração SANTINO

Atualizado em 15/11/2026 (America/Sao_Paulo), após verificação do deploy de produção.

## Situação atual

- O projeto Supabase correto está acessível nesta sessão: **Santino Nobre**, ref `optloyhbkkrptuwsizrc`, status saudável. A tabela legada `public.pesquisas_santino` segue presente e com RLS; seus dados não foram alterados.
- O deploy de produção do projeto **Santino Nobre** está ativo. A listagem remota confirma as sete migrations da `main`; o projeto vazio `santino-commerce` não foi usado nem alterado.
- O site público está em https://samuelluisz7.github.io/Santino/ e a revisão visual mais recente foi publicada após o workflow de validação da branch `main`.
- Correção de cache dos arquivos CSS/JavaScript publicada: as sete páginas solicitam versões identificadas dos assets locais (`?v=20261115-3`); o teste de proteção passou no workflow do Pages.
- A página apresenta a vitrine de quatro itens reais logo após os caminhos compactos por categoria; mantém preços e imagens do catálogo e a explicação das regras aprovadas de cashback.
- Revisão visual publicada: procedência, formas de pagamento e entrega aparecem depois dos caminhos por categoria e antes dos perfumes em destaque; nenhum dado comercial mudou.
- A validação da revisão de cache aprovou 23 testes Node; migrations e pgTAP passaram em Postgres descartável no GitHub Actions.

## Auditoria e segurança concluídas

- A auditoria de catálogo agora compara automaticamente decants, frascos inteiros e detalhes; o resultado e as divergências de imagem, identidade e descrição estão documentados em `docs/catalog-reconciliation.md`.
- A migration `20261115131834_product_variant_images.sql` acrescenta imagem opcional por variante; não há backfill nem dados comerciais incluídos.

- [x] Mapeadas páginas, catálogo, variantes, kits, busca, carrinho e montagem estática do GitHub Pages.
- [x] Confirmada a tabela antiga `public.pesquisas_santino`, sua política de inserção anônima e a preservação dos registros existentes.
- [x] O frontend continua sem criar pedidos no banco ou iniciar pagamentos reais. O checkout atual revisa e encaminha o pedido pelo WhatsApp.
- [x] O workflow publica somente arquivos do site; `supabase/`, documentação, testes e notas internas ficam fora do artefato.
- [x] Campos do carrinho lidos do `localStorage` são escapados antes de entrar no HTML. Valores do navegador continuam não confiáveis e precisam ser recalculados no servidor antes de qualquer pedido futuro.

## Preparação do banco — somente local

- [x] Criada a baseline `20261115013651_baseline_pesquisas_santino.sql`, sem truncar, recriar ou remover `pesquisas_santino`.
- [x] Criada `20261115024051_catalog_core.sql`, com catálogo, variantes, kits e componentes vazios e inativos por padrão.
- [x] Criada `20261115033710_olfactory_profiles.sql`, sem dados semeados, para representar a pirâmide olfativa já mantida na página de detalhes.
- [x] Criada `20261115131834_product_variant_images.sql`, com `product_variants.image_url` opcional e limite de 2048 caracteres; sem backfill.
- [x] Criada `20261115145000_staged_catalog_import.sql`, com 51 produtos e 116 variantes copiadas das fontes atuais, todos inativos; os três IDs com conflitos ficaram fora.
- [x] Criada `20261115150000_order_foundation.sql`, com pedidos e itens em tabelas protegidas por RLS; os snapshots ficam disponíveis apenas para operação server-side.
- [x] Criada `20261115151000_order_rls_deny.sql`, com políticas explícitas que bloqueiam anon/authenticated; o advisor de segurança ficou sem avisos.
- [x] Publicada a Edge Function `create-order` no projeto correto com JWT obrigatório; ela permanece sem uso até configurar `SANTINO_ORDER_API_TOKEN`.
- [x] As quatro migrations da `main` foram aplicadas ao projeto correto após a ativação do deploy: baseline legada, catálogo, perfis olfativos e imagem por variante. O schema remoto foi conferido; RLS está ativo nas tabelas e as tabelas novas contêm 51 produtos e 116 apresentações em modo inativo; nenhum deles é exibido no site.
- [x] Testes pgTAP cobrem a baseline, o RLS e grants do catálogo e o acesso aos perfis olfativos.
- O workflow executa a validação conjunta das migrations em Postgres descartável do CI; Docker não está disponível neste Windows para repetir o replay localmente.
- [x] Deploy automático `main` → Santino Nobre ativado pelo usuário e confirmado pela listagem remota de migrations.

## Sincronização do schema Supabase

- A `main` contém quatro migrations versionadas e todas aparecem no histórico remoto. O banco mantém `public.pesquisas_santino` e inclui as novas tabelas de catálogo, ainda sem produtos carregados.
- O workflow do GitHub valida as migrations em Postgres descartável; ele não possui conexão com o banco de produção.
- O `apply_migration` do Supabase MCP não aceita a versão original do arquivo e registra um timestamp próprio. Não o usar para aplicar migrations do repositório, pois criaria entradas remotas sem correspondência exata no histórico Git.
- Caminho recomendado pela documentação do Supabase: ativar `Deploy to production` na integração GitHub do projeto e selecionar `main`, ou usar `supabase db push --linked` com CLI autenticada.
- A configuração `Deploy to production` foi ativada pelo usuário e o deploy foi confirmado no projeto correto. A CLI v3.1.0 foi usada em pasta temporária apenas para gerar o nome oficial da migration; não houve login nem comando remoto.
- Próximo passo: revisar os 51 produtos importados em modo inativo e resolver os três IDs pendentes antes de ativar qualquer registro no site.

## Cashback aprovado e estado de implementação

- Regras alinhadas: 5% sobre o valor pago pelos produtos após descontos; crédito liberado após confirmação do pagamento; validade de 90 dias; acumulável com promoções de produtos; utilização de até 100% do valor dos produtos; frete separado; sem conversão em dinheiro; aplicável a decants, frascos inteiros, kits e produtos futuros.
- O crédito de indicação de R$ 20,00 é uma campanha independente com condições próprias já publicadas.
- A página inicial e as políticas agora explicam as regras sem exibir saldo fictício. Consulta autenticada, histórico, alertas de vencimento e aplicação automática no carrinho ainda não existem.
- O canal de verificação de identidade permanece pendente. Não é seguro liberar saldo apenas com um telefone digitado no site.

## Reformulação da página inicial

- 15/11/2026: revisão visual ampla publicada no commit `00f6d324` ([PR #8](https://github.com/Samuelluisz7/Santino/pull/8)). O banner principal agora ocupa a largura da tela; decants, frascos e kits aparecem em cartões de compra; a vitrine usa molduras quadradas e botões mais destacados. Layout adaptado para celular.
- A revisão preservou produtos, nomes, marcas, imagens, preços, descontos e regras comerciais.
- Validação da revisão: 26 testes Node e 77 verificações pgTAP aprovados no CI; a publicação no GitHub Pages concluiu com sucesso no workflow 417. Nenhuma migration foi aplicada ao Supabase.

- Estrutura baseada na referência enviada: hero, caminhos por categoria, produtos em destaque, promoção, fidelidade, kits e rodapé.
- Os quatro produtos destacados usam os nomes, marcas, imagens e preços que já constam em `decants.html`; a seleção não é chamada de “mais vendidos”.
- O botão de cada produto permite selecionar 5 ou 10 ml e adiciona ao `santino_nobre_cart` no mesmo formato usado pelo catálogo.
- A moldura das imagens dos produtos mantém proporção 4:3 e `object-fit: contain`, sem cortar o frasco. A página de detalhe continua com pirâmide olfativa.
- Oferta de 10% e crédito por indicação mantêm as condições existentes. Nenhum preço, produto, imagem de origem ou desconto foi alterado.
- Os links dos kits da página inicial agora apontam para IDs existentes em `kits.html`.

## Validação e próximos incrementos

- [x] GitHub Actions: 22 testes Node aprovados, cobrindo build do Pages, links, consistência de catálogo/preços, interação com carrinho, ordem visual da página inicial, regras de cashback, proteção contra credenciais e planos pgTAP.
- O workflow valida Pull Requests, recria as migrations apenas em banco descartável e só executa o deploy do Pages após validação na branch `main`.
- Nenhum script do workflow recebe credenciais de produção nem usa conexão `--remote` para migrations.
- [ ] Projetar o ledger de cashback e o fluxo de pedidos server-side antes de conectar qualquer função comercial ao banco.
- [x] Pagamentos reais permanecem desligados. O deploy de migrations está ativo; qualquer migration futura deve passar pelo CI antes de chegar à `main`.

## Próximos passos da experiência

- Newsletter/cadastro de e-mail segue pendente porque ainda não há serviço ou fluxo aprovado para receber inscrições.

## Restrições preservadas

- Não foi criado nem excluído projeto Supabase.
- A tabela `pesquisas_santino` e seus registros foram preservados; as novas linhas de catálogo permanecem inativas.
- Nenhuma chave secreta foi colocada no frontend ou no repositório.
- Pagamentos reais continuam desligados.
