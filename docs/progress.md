# Progresso da integração SANTINO

Atualizado em 15/11/2026 (America/Sao_Paulo).

## Situação atual

- O projeto Supabase correto está acessível nesta sessão: **Santino Nobre**, ref `optloyhbkkrptuwsizrc`, status saudável. A tabela `public.pesquisas_santino` segue presente e com RLS. A leitura agregada anterior confirmou 6 registros; nenhum termo foi lido.
- A listagem remota atual de migrations continua vazia (`[]`). Nenhuma migration foi aplicada. O projeto vazio `santino-commerce` não foi usado nem alterado.
- O site anterior está publicado no GitHub Pages: https://samuelluisz7.github.io/Santino/. A publicação mais recente confirmada nesta trilha é o commit `2893edb6230242c70d3e6625ed7bc4f8036e7cea`; o workflow de Pages #54 passou.
- A página inicial foi reorganizada com vitrine de quatro itens reais do catálogo, caminhos por categoria, oferta existente, kits com destinos corretos e explicação do cashback. Os 20 testes Node locais passam; a publicação no GitHub Pages é controlada pelo workflow da branch `main`.

## Auditoria e segurança concluídas

- [x] Mapeadas páginas, catálogo, variantes, kits, busca, carrinho e montagem estática do GitHub Pages.
- [x] Confirmada a tabela antiga `public.pesquisas_santino`, sua política de inserção anônima e a preservação dos registros existentes.
- [x] O frontend continua sem criar pedidos no banco ou iniciar pagamentos reais. O checkout atual revisa e encaminha o pedido pelo WhatsApp.
- [x] O workflow publica somente arquivos do site; `supabase/`, documentação, testes e notas internas ficam fora do artefato.
- [x] Campos do carrinho lidos do `localStorage` são escapados antes de entrar no HTML. Valores do navegador continuam não confiáveis e precisam ser recalculados no servidor antes de qualquer pedido futuro.

## Preparação do banco — somente local

- [x] Criada a baseline `20261115013651_baseline_pesquisas_santino.sql`, sem truncar, recriar ou remover `pesquisas_santino`.
- [x] Criada `20261115024051_catalog_core.sql`, com catálogo, variantes, kits e componentes vazios e inativos por padrão.
- [x] Criada `20261115033710_olfactory_profiles.sql`, sem dados semeados, para representar a pirâmide olfativa já mantida na página de detalhes.
- [x] Testes pgTAP cobrem a baseline, o RLS e grants do catálogo e o acesso aos perfis olfativos.
- O workflow executa a validação conjunta das migrations em Postgres descartável do CI; Docker não está disponível neste Windows para repetir o replay localmente.
- [ ] Só depois de revisar os resultados e receber autorização explícita, considerar aplicação no projeto remoto. O trabalho atual não aplica migrations.

## Cashback aprovado e estado de implementação

- Regras alinhadas: 5% sobre o valor pago pelos produtos após descontos; crédito liberado após confirmação do pagamento; validade de 90 dias; acumulável com promoções de produtos; utilização de até 100% do valor dos produtos; frete separado; sem conversão em dinheiro; aplicável a decants, frascos inteiros, kits e produtos futuros.
- O crédito de indicação de R$ 20,00 é uma campanha independente com condições próprias já publicadas.
- A página inicial e as políticas agora explicam as regras sem exibir saldo fictício. Consulta autenticada, histórico, alertas de vencimento e aplicação automática no carrinho ainda não existem.
- O canal de verificação de identidade permanece pendente. Não é seguro liberar saldo apenas com um telefone digitado no site.

## Reformulação da página inicial

- Estrutura baseada na referência enviada: hero, caminhos por categoria, produtos em destaque, promoção, fidelidade, kits e rodapé.
- Os quatro produtos destacados usam os nomes, marcas, imagens e preços que já constam em `decants.html`; a seleção não é chamada de “mais vendidos”.
- O botão de cada produto permite selecionar 5 ou 10 ml e adiciona ao `santino_nobre_cart` no mesmo formato usado pelo catálogo.
- A moldura das imagens dos produtos mantém proporção 4:3 e `object-fit: contain`, sem cortar o frasco. A página de detalhe continua com pirâmide olfativa.
- Oferta de 10% e crédito por indicação mantêm as condições existentes. Nenhum preço, produto, imagem de origem ou desconto foi alterado.
- Os links dos kits da página inicial agora apontam para IDs existentes em `kits.html`.

## Validação e próximos incrementos

- [x] Testes Node locais: 21 aprovados, cobrindo build do Pages, links, consistência de catálogo/preços, interação com carrinho, termos do cashback, proteção contra credenciais e contagem dos planos pgTAP.
- O workflow valida Pull Requests, recria as migrations apenas em banco descartável e só executa o deploy do Pages após validação na branch `main`.
- Nenhum script do workflow recebe credenciais de produção nem usa conexão `--remote` para migrations.
- [ ] Projetar o ledger de cashback e o fluxo de pedidos server-side antes de conectar qualquer função comercial ao banco.
- [ ] Manter pagamentos reais desligados e não ativar sincronização automática de migrations com produção.

## Restrições preservadas

- Não foi criado nem excluído projeto Supabase.
- Nenhuma migration remota foi aplicada; `pesquisas_santino` e seus registros foram preservados.
- Nenhuma chave secreta foi colocada no frontend ou no repositório.
- Pagamentos reais continuam desligados.
