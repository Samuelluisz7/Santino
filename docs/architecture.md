# Arquitetura técnica da SANTINO

Auditoria inicial: 14/11/2026. Este documento descreve o estado observado e a arquitetura proposta; não autoriza mudanças comerciais nem migrations.

## Estado observado

- A aplicação é um site estático de várias páginas hospedado no GitHub Pages. O catálogo, as páginas de detalhes, os kits, a busca e o carrinho estão distribuídos em HTML e JavaScript.
- O carrinho é mantido no localStorage do navegador. A finalização atual prepara um pedido para o WhatsApp; não há criação de pedidos no banco nem integração de pagamentos.
- Os dados comerciais aparecem em mais de uma página. A sincronização dos dados entre páginas permanece necessária até que haja uma fonte central validada.
- A busca grava o termo digitado no endpoint REST de pesquisas_santino usando uma chave publicável no navegador. A tabela e suas políticas precisam ser inspecionadas no projeto correto antes de qualquer alteração.
- produto.html contém uma URL de imagem pública de Supabase Storage que aponta para um segundo project ref.
- O workflow do Pages exclui supabase/ do site público. Este trabalho acrescenta testes automáticos para essa fronteira.

## Identidade do projeto Supabase

- O usuário identifica o projeto de produção como Santino Nobre e exige preservar a tabela pesquisas_santino e todos os seus registros.
- O código existente aponta o registro de buscas para o ref optloyhbkkrptuwsizrc. Este é um candidato derivado do endpoint do site, ainda sem confirmação no painel de administração.
- A conexão Supabase disponível nesta sessão expõe apenas o projeto santino-commerce, ref ufopdavfklzqfsqkhhxe. O usuário confirmou que esse projeto vazio foi criado por engano e não deve ser usado nem excluído.
- A auditoria dessa conexão encontrou zero tabelas, migrations e Edge Functions. Isso não descreve o estado de Santino Nobre.
- Nenhuma migration foi aplicada. A conexão administrativa ao projeto Santino Nobre e o project ref precisam ser confirmados antes de qualquer sincronização.

## Arquitetura proposta

### Front-end

- Manter o GitHub Pages como vitrine estática, sem segredos no navegador.
- Continuar preservando o catálogo, preços, imagens, descontos e identidade visual até haver autorização explícita para mudanças.
- Tratar os valores recebidos do navegador como não confiáveis. O conteúdo do localStorage não deve determinar preço ou total de um pedido.

### Banco e acesso

- Manter migrations versionadas em supabase/migrations e protegidas pelo workflow para que nunca façam parte do artefato público do Pages.
- Após confirmar o projeto correto, registrar o estado atual como baseline revisada e verificar schema, RLS, políticas, funções e dados da tabela pesquisas_santino sem alterá-los.
- Criar estruturas novas e aditivas para catálogo, variantes, pedidos e itens de pedido. Cada item de pedido deverá guardar snapshots dos dados e preços aceitos no momento da criação. O catálogo atual não será importado até o mapeamento dos registros estar validado.
- Permitir leitura pública somente dos campos comerciais aprovados dos produtos ativos. Custos e informações administrativas devem permanecer fora da resposta pública.
- A tabela de pesquisas existente permanece intacta. Depois de confirmar suas políticas, limitar o cliente público à ação mínima necessária; sem leitura, atualização ou exclusão pública.

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

- O GitHub Pages publica somente o conteúdo do site. Pastas de desenvolvimento e supabase/ ficam fora do artefato.
- O usuário informa que a integração GitHub do Supabase está conectada. Antes do primeiro merge de migration, confirmar qual repositório/branch e projeto ela sincroniza.
- Cada alteração de schema deve ser aditiva e revisada. Não usar reset remoto nem modificar pesquisas_santino.
- O workflow executa testes Node sem dependências externas para validar a separação entre arquivos públicos e privados.
- A validação local de migrations com Supabase CLI/Docker ainda não está disponível neste ambiente; instalar/usar essas ferramentas e executar uma validação local ficará para depois da confirmação do projeto.

## Riscos de segurança observados

- A chave do front-end tem formato publicável. Isso é compatível com cliente público, mas a segurança depende de permissões e RLS no projeto correto.
- O código registra termos de busca diretamente em um endpoint público. Termos livres podem conter dados pessoais; são limitados a 100 caracteres, mas a política de retenção e o acesso de leitura da tabela não foram confirmados.
- O texto de busca também aparece na URL da navegação. Evitar registrar dados pessoais e não expor esse histórico em logs ou análises desnecessárias.
- O carrinho é editável pelo usuário. O servidor deve recalcular preços, descontos e estoque antes de aceitar qualquer pedido.
- As referências Supabase encontradas no site não coincidem com o projeto santino-commerce visível na conexão administrativa atual.
