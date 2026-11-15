# Progresso da integração SANTINO

Atualizado em 15/11/2026 (America/Sao_Paulo).

## Situação atual

- O projeto Supabase correto está acessível nesta sessão: **Santino Nobre**, ref `optloyhbkkrptuwsizrc`, status saudável. A tabela legada `public.pesquisas_santino` segue presente e com RLS; seus dados não foram alterados.
- A listagem remota atual de migrations continua vazia (`[]`). Nenhuma migration foi aplicada. O projeto vazio `santino-commerce` não foi usado nem alterado.
- O site público está em https://samuelluisz7.github.io/Santino/ e a revisão visual mais recente foi publicada após o workflow de validação da branch `main`.
- A página apresenta a vitrine de quatro itens reais logo após os caminhos compactos por categoria; mantém preços e imagens do catálogo e a explicação das regras aprovadas de cashback.
- A validação dessa revisão aprovou 22 testes Node e 77 verificações pgTAP em Postgres descartável.

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

## Sincronização do schema Supabase

- A branch `main` contém três migrations versionadas para a baseline da tabela legada, catálogo e perfis olfativos. A listagem atual do Supabase continua vazia; o banco remoto ainda possui apenas a tabela de pesquisas já existente.
- O workflow do GitHub valida as migrations em Postgres descartável; ele não possui conexão com o banco de produção.
- O `apply_migration` do Supabase MCP não aceita a versão original do arquivo e registra um timestamp próprio. Não o usar para aplicar migrations do repositório, pois criaria entradas remotas sem correspondência exata no histórico Git.
- Caminho recomendado pela documentação do Supabase: ativar `Deploy to production` na integração GitHub do projeto e selecionar `main`, ou usar `supabase db push --linked` com CLI autenticada.
- A última configuração de integração verificada registrava `Deploy to production` desligado. O CLI local não está instalado nem autenticado nesta sessão, portanto nenhuma migration foi aplicada remotamente.
- Próximo passo de sincronização: confirmar/ativar a opção de deploy automático na integração já conectada; depois validar no Supabase que as três versões aparecem no histórico e que o schema permanece aditivo.

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

- [x] GitHub Actions: 22 testes Node aprovados, cobrindo build do Pages, links, consistência de catálogo/preços, interação com carrinho, ordem visual da página inicial, regras de cashback, proteção contra credenciais e planos pgTAP.
- O workflow valida Pull Requests, recria as migrations apenas em banco descartável e só executa o deploy do Pages após validação na branch `main`.
- Nenhum script do workflow recebe credenciais de produção nem usa conexão `--remote` para migrations.
- [ ] Projetar o ledger de cashback e o fluxo de pedidos server-side antes de conectar qualquer função comercial ao banco.
- [ ] Manter pagamentos reais desligados e não ativar sincronização automática de migrations com produção.

## Próximos passos da experiência

- Newsletter/cadastro de e-mail segue pendente porque ainda não há serviço ou fluxo aprovado para receber inscrições.

## Restrições preservadas

- Não foi criado nem excluído projeto Supabase.
- Nenhuma migration remota foi aplicada; `pesquisas_santino` e seus registros foram preservados.
- Nenhuma chave secreta foi colocada no frontend ou no repositório.
- Pagamentos reais continuam desligados.
