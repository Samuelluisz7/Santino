# Arquitetura técnica da SANTINO

Auditoria inicial: 14/11/2026. Este documento descreve o estado observado e a arquitetura proposta; não autoriza mudanças comerciais nem migrations.

## Estado observado

- A aplicação é um site estático de várias páginas hospedado no GitHub Pages. O catálogo, as páginas de detalhes, os kits, a busca e o carrinho estão distribuídos em HTML e JavaScript.
- O carrinho é mantido no localStorage do navegador. A finalização atual prepara um pedido para o WhatsApp; não há criação de pedidos no banco nem integração de pagamentos.
- Os dados comerciais aparecem em mais de uma página. A sincronização dos dados entre páginas permanece necessária até que haja uma fonte central validada.
- A busca grava o termo digitado no endpoint REST de `pesquisas_santino` usando uma chave publicável no navegador. A tabela foi inspecionada por leitura no projeto correto; seu RLS permite somente a inserção anônima validada.
- produto.html contém uma URL de imagem pública de Supabase Storage que aponta para um segundo project ref.
- O artefato do Pages agora aceita apenas formatos de site e `robots.txt`, omitindo `supabase/`, documentação e pastas de desenvolvimento. O empacotador anterior copiava `CATALOGO.md` e `LEIA-ME.txt` junto com todos os arquivos visíveis da raiz.

## Modelo atual do catálogo

- `decants.html` e `kits.html` repetem a identidade de fragrâncias (ID, nome, marca, imagem e descrição curta) e definem preços por volume; a lista de detalhes em `produto.html` mantém outra representação dos mesmos produtos.
- `frascos.html` e `produto.html` representam apresentações de frasco por volume e preço; o detalhe suporta uma ou várias apresentações e preço sob consulta.
- `kits.html` define kits como grupos de IDs de produtos, sem preço fixo próprio. A pessoa escolhe volume de 5 ou 10 ml e quantidade de 1 a 5 para cada componente; o total é a soma das variantes escolhidas.
- O modelo futuro precisa manter produtos canônicos, variantes vendáveis, definições/componentes de kit e snapshots de cada variante e quantidade no pedido. Nenhum registro comercial foi importado ou alterado nesta etapa.

## Reconciliação das fontes antes da importação

- A auditoria automatizada das três listas encontrou 32 decants, 49 frascos, 27 IDs compartilhados e 54 produtos únicos; todos os 54 têm detalhe na página compartilhada e não há IDs duplicados dentro de cada lista.
- As fontes divergem em 5 imagens, 1 identidade (nome/marca) e 2 descrições para IDs compartilhados. O relatório em `docs/catalog-reconciliation.md` lista somente os IDs e os campos, sem copiar preços, URLs de imagem ou textos.
- A migration `20261115131834_product_variant_images.sql` acrescenta `image_url` opcional a `product_variants`; a migration seguinte preserva imagens específicas e importa somente registros sem conflitos textuais, sempre inativos. Quando o campo da variante estiver vazio, a camada de catálogo poderá usar `products.image_url` como fallback.
- As diferenças de nome/marca e descrição permanecem sem resolução. Nenhum registro do catálogo foi alterado nem importado ao banco.

## Cashback e fidelização

- Regras comerciais confirmadas: cashback de 5% sobre o valor efetivamente pago pelos produtos após descontos, liberado após confirmação do pagamento, válido por 90 dias, acumulável com promoções de produtos e utilizável em até 100% do valor dos produtos. O frete é pago separadamente e o crédito não pode ser convertido em dinheiro. A regra vale para decants, frascos inteiros, kits e produtos futuros.
- O crédito de indicação de R$ 20,00 é uma campanha distinta e mantém as condições próprias publicadas nas políticas; não deve ser misturado com o saldo de cashback.
- O site estático ainda não consulta saldos, registra créditos ou aplica resgates no carrinho. A página informa essa limitação e direciona dúvidas à loja; não exibe valores ou saldos simulados.
- A futura implementação deve manter um ledger de créditos e resgates no servidor, com referência ao pedido, valor líquido elegível, data de liberação, vencimento e estado. A criação do crédito depende da confirmação do pagamento; o resgate precisa ser atômico e limitado ao valor dos produtos, sem reduzir o frete. Alterações/cancelamentos devem gerar lançamentos de estorno, sem reescrever o histórico.
- A consulta segura depende de autenticação do cliente. O canal de verificação de identidade ainda precisa ser definido; telefone ou qualquer dado digitado pelo cliente não deve, por si só, autorizar acesso ao saldo.

## Identidade e auditoria do Supabase

- O Supabase MCP confirmou o projeto **Santino Nobre**, ref `optloyhbkkrptuwsizrc`, na organização Santino, região `us-east-1`, status `ACTIVE_HEALTHY`, PostgreSQL 17.
- O projeto acidental `santino-commerce`, ref `ufopdavfklzqfsqkhhxe`, continua fora de uso e não foi alterado nem excluído.
- A auditoria encontrou a tabela `public.pesquisas_santino`, pertencente a `postgres`, com RLS ativado e `FORCE ROW LEVEL SECURITY` desativado. Colunas: `id bigint GENERATED ALWAYS AS IDENTITY NOT NULL`, `termo text NOT NULL` e `pesquisado_em timestamptz NOT NULL DEFAULT now()`. A única restrição e índice são a chave primária em `id`; não há triggers próprios nem outras restrições.
- A tabela contém dados legados; nenhum termo foi lido e nenhum dado foi alterado durante a auditoria.
- Existe uma política permissiva para `anon INSERT`; ela só permite termos com tamanho após `trim` entre 1 e 100 caracteres. `anon` não tem leitura, atualização ou exclusão; `authenticated` não tem grants diretos. `service_role` tem TRUNCATE/REFERENCES/TRIGGER diretos, sem grants diretos de DML.
- No início da auditoria, o histórico remoto do Supabase estava vazio e o repositório tinha somente `supabase/README.md`. Após a reconexão, foram criadas localmente uma baseline aditiva para a tabela existente, uma fundação vazia do catálogo e o perfil olfativo; nenhuma delas foi aplicada remotamente.
- Não há Edge Functions nem funções de aplicação no schema `public`. Os advisors de segurança, desempenho e saúde não retornaram avisos.
- O painel do projeto confirma a integração GitHub com `Samuelluisz7/Santino` e diretório de trabalho `.`. `Deploy to production` e a criação automática de branches estão desligados; o campo de branch de produção fica desabilitado, portanto a branch de sincronização não está configurada nem pode ser confirmada enquanto o deploy está off.

## Arquitetura proposta

### Front-end

- Manter o GitHub Pages como vitrine estática, sem segredos no navegador.
- Continuar preservando o catálogo, preços, imagens, descontos e identidade visual até haver autorização explícita para mudanças.
- Tratar os valores recebidos do navegador como não confiáveis. O conteúdo do localStorage não deve determinar preço ou total de um pedido.

### Banco e acesso

- Manter migrations versionadas em supabase/migrations e protegidas pelo workflow para que nunca façam parte do artefato público do Pages.
- Para tabelas novas, conceder em cada migration somente os privilégios necessários e conferir a exposição na Data API separadamente do RLS; a existência de policy não concede acesso ao endpoint.
- Preparar e revisar a baseline do schema remoto antes de propor migrations. Não recriar, truncar ou modificar `public.pesquisas_santino`.
- Criar estruturas novas e aditivas para catálogo, variantes, pedidos e itens de pedido. Cada item de pedido deverá guardar snapshots dos dados e preços aceitos no momento da criação. O catálogo atual não será importado até o mapeamento dos registros estar validado.
- Permitir leitura pública somente dos campos comerciais aprovados dos produtos ativos. Custos e informações administrativas devem permanecer fora da resposta pública.
- Manter a tabela de pesquisas limitada à inserção anônima já existente, sem leitura pública. Avaliar limites contra abuso e retenção antes de ampliar essa entrada.

### Criação de pedidos e pagamentos

- A migration `20261115150000_order_foundation.sql` criou `orders` e `order_items` com snapshots do produto, apresentação, preço unitário e quantidade. Os totais são calculados no banco.
- A migration `20261115151000_order_rls_deny.sql` adicionou políticas explícitas que negam todas as operações de `anon` e `authenticated`; somente o papel server-side recebe grants.
- O checkout público continua no WhatsApp e não grava pedidos no banco até existir uma função server-side que valide catálogo ativo, preço e quantidade em uma operação atômica.

- Implementar a criação de pedidos através de uma Edge Function que valide produtos, variantes, disponibilidade, quantidades e preços no servidor.
- Negar escrita pública direta nas tabelas de pedidos. A função deverá validar entrada, aplicar limites contra abuso e criar os snapshots do pedido.
- Usar estados de pedido sem liquidação financeira, com atendimento manual/WhatsApp enquanto não houver provedor de pagamento aprovado.
- Manter pagamentos reais desligados até autorização explícita. Futuramente, segredos e validação de webhooks ficam apenas no servidor/Supabase.

### Autenticação administrativa

- Adicionar uma área administrativa somente depois de definir os responsáveis e o fluxo de acesso.
- Usar Supabase Auth e autorização explícita para operações administrativas; não usar user metadata editável para decisões de permissão.
- Nunca colocar service_role, chaves secretas ou credenciais de banco no front-end, no repositório ou no artefato do Pages.

## Preparação da baseline e validação

- `supabase/config.toml` foi gerado pela CLI 3.1.0; `project_id = "santino-local"` é apenas o identificador local e o checkout não está linkado ao projeto remoto. No ambiente local, novas tabelas não são expostas automaticamente pela Data API e a execução de seeds está desligada; migrations precisam conceder acesso explicitamente.
- `supabase/migrations/20261115013651_baseline_pesquisas_santino.sql` registra o schema legado sem apagar, recriar ou ler os seis registros. A tabela é criada somente se estiver ausente; RLS e a permissão atual de `anon INSERT` ficam declaradas. A policy `Permitir registrar pesquisas` é criada apenas quando não existe.
- `supabase/migrations/20261115024051_catalog_core.sql` cria tabelas vazias e aditivas para produtos, variantes, kits e componentes; as linhas públicas começam inativas e as escritas permanecem restritas ao servidor.
- `supabase/migrations/20261115033710_olfactory_profiles.sql` cria uma tabela opcional um-para-um para a pirâmide e o texto olfativo que já aparecem em `produto.html`, sem copiar nem inventar conteúdo comercial.
- O acesso ao projeto correto está confirmado; as cinco migrations foram validadas no CI e aplicadas pelo deploy de produção. A carga de catálogo continua inativa até revisão.
- O workflow de Pages `.github/workflows/pages.yml` inicia Postgres local descartável quando há migrations, reseta somente esse banco e executa `supabase test db` antes da publicação. O workflow não recebe credenciais de produção nem usa `--remote`.

## Implantação e validações

- O GitHub Pages publica somente o conteúdo do site. Pastas de desenvolvimento e supabase/ ficam fora do artefato.
- A integração do Supabase mostra o repositório `Samuelluisz7/Santino`; o deploy automático está habilitado e o histórico remoto contém as cinco migrations versionadas.
- O GitHub Pages publica `https://samuelluisz7.github.io/Santino/`. A versão publicada é atualizada pela branch `main` somente após a validação do workflow de Pages; mudanças de schema continuam sem deploy automático para o Supabase.
- Cada alteração de schema deve ser aditiva e revisada. A baseline local de `pesquisas_santino` é idempotente para o estado auditado; não usar reset remoto nem alterar os seis registros.
- O workflow executa testes Node sem dependências externas e monta o artefato a partir de uma lista de formatos estáticos permitidos; um teste também valida o repositório real.
- A CLI 3.1.0 foi obtida em pasta temporária e usada para inicializar a pasta e gerar a baseline; o digest oficial da release foi verificado. Docker não está disponível no Windows. O GitHub Actions run #43677256372 validou as três migrations em Postgres descartável e aprovou 77 verificações pgTAP; nenhuma migration foi aplicada remotamente.

## Riscos de segurança observados

- A chave do front-end tem formato publicável. Isso é compatível com cliente público, mas a segurança depende de permissões e RLS no projeto correto.
- Qualquer visitante anônimo pode inserir termos de busca de 1 a 100 caracteres. A política impede leitura pública, mas não demonstra proteção contra spam; termos livres também podem conter dados pessoais.
- O texto de busca também aparece na URL da navegação. Evitar registrar dados pessoais e não expor esse histórico em logs ou análises desnecessárias.
- O carrinho é editável pelo usuário. O servidor deve recalcular preços, descontos e estoque antes de aceitar qualquer pedido.
- O armazenamento do carrinho pode ser alterado no navegador. Esta PR escapa `key`, `ml` e `qty` antes de inseri-los no markup; os valores comerciais continuam não confiáveis e deverão ser recalculados pelo servidor ao criar pedidos.
- O workflow anterior incluía `CATALOGO.md` e `LEIA-ME.txt` no artefato do Pages. A nova lista permitida os exclui, sem mudar as páginas ou os dados comerciais.
