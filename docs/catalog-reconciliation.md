# Conciliação das fontes de catálogo

Auditoria automatizada executada em 15/11/2026. O comando `node scripts/audit-catalog-sources.mjs` lê apenas os arquivos atuais do site e imprime contagens e diferenças por ID/campo; não altera catálogo, preços, imagens nem o banco.

## Cobertura

| Fonte | Registros |
| --- | ---: |
| Decants | 32 |
| Frascos inteiros | 49 |
| IDs presentes nas duas listas | 27 |
| Produtos únicos | 54 |
| Detalhes compartilhados em `produto.html` | 54 |

Todos os 54 IDs de catálogo têm um registro na página compartilhada de detalhes, sem IDs duplicados nas três fontes.

## Diferenças entre as listas

- Imagem: 5 IDs — `asad-bourbon`, `fakhar-black`, `homem-dom`, `kingdom`, `the-blend-bourbon`.
- Nome ou marca: 1 ID — `k-max`.
- Descrição: 2 IDs — `full-cebolinha`, `full-nautica-voyage`.

A auditoria registra IDs e campos divergentes, sem copiar URLs, preços ou textos comerciais. Ela não decide se uma imagem diferente é intencional para a apresentação, nem qual valor deve prevalecer em nome, marca ou descrição.

## Consequência para o modelo do banco

A migration `20261115131834_product_variant_images.sql` acrescenta `product_variants.image_url` como campo opcional, sem backfill, para preservar imagens distintas entre decant e frasco inteiro. O dado compartilhado segue em `products.image_url`; quando a variante não tiver imagem própria, o importador poderá usá-lo como fallback. A migration está versionada no repositório, mas ainda não foi aplicada ao projeto remoto.

A diferença de identidade em `k-max` e as duas diferenças de descrição precisam de revisão antes de importar os registros. Nenhum produto foi semeado nem modificado para esta auditoria.

O teste `tests/catalog-source-audit.test.mjs` compara os conflitos observados com esta auditoria. Uma mudança nos campos deve passar por revisão e atualização explícita do registro de diferenças.
