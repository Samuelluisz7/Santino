# Manutenção do catálogo SANTINO

O site é estático e usa `produto.html` como fonte principal dos dados de produtos. As páginas `decants.html`, `frascos.html` e `kits.html` montam a apresentação e o carrinho a partir de seus próprios blocos de dados.

## Alterações recomendadas

Antes de publicar uma alteração comercial, confira sempre o produto em `produto.html` e na página de categoria correspondente. Para cada item, mantenha sincronizados `id`, nome, marca, imagem, descrição, volumes e preços.

Os decants atualmente usam os volumes de **5 ml e 10 ml**. Produtos sem preço confirmado devem continuar usando o fluxo de consulta pelo WhatsApp; não substitua preço pendente por valor estimado.

## Imagens

A preferência é usar imagens locais do repositório ou URLs estáveis com autorização de uso. Quando uma imagem externa for mantida, o cartão deve conservar `alt`, `loading="lazy"`, `decoding="async"` e um fallback visual para falha de carregamento.

## Publicação

O workflow `.github/workflows/pages.yml` publica automaticamente a branch `main` no endereço:

<https://samuelluisz7.github.io/Santino/>

Para uma mudança de conteúdo: editar, testar localmente, executar `git diff --check`, verificar as páginas no navegador e publicar na branch `main`.
