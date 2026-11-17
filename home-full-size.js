(function () {
  "use strict";

  const grid = document.getElementById("homeFullSizeGrid");
  const status = document.getElementById("homeFullSizeStatus");
  const source = document.getElementById("homeFullSizeProducts");
  if (!grid || !source) return;

  const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  let products;
  try {
    products = JSON.parse(source.textContent);
  } catch (error) {
    if (status) status.textContent = "Não foi possível carregar os frascos em destaque.";
    return;
  }
  if (!Array.isArray(products)) {
    if (status) status.textContent = "A seleção de frascos está indisponível.";
    return;
  }

  products.forEach(function (product) {
    if (!product || !product.id || !product.name || !product.brand ||
        !product.image || !Number.isFinite(Number(product.ml)) ||
        !Number.isFinite(Number(product.price))) return;

    const card = document.createElement("article");
    card.className = "home-product-card home-full-bottle-card";

    const detail = document.createElement("a");
    detail.className = "home-product-detail";
    detail.href = "produto.html?id=" + encodeURIComponent(product.id);
    detail.setAttribute("aria-label", "Ver detalhes de " + product.name);

    const imageFrame = document.createElement("span");
    imageFrame.className = "home-product-image home-full-bottle-image";
    const image = document.createElement("img");
    image.src = product.image;
    image.alt = "Frasco inteiro de " + product.name + ", " + product.ml + " ml";
    image.loading = "lazy";
    image.decoding = "async";
    image.referrerPolicy = "no-referrer";
    const fallback = document.createElement("span");
    fallback.className = "home-product-fallback";
    fallback.textContent = "SANTINO";
    fallback.hidden = true;
    image.addEventListener("error", function () {
      image.hidden = true;
      fallback.hidden = false;
    }, { once: true });

    const volumeTag = document.createElement("span");
    volumeTag.className = "home-image-tag";
    volumeTag.textContent = product.ml + " ml";
    imageFrame.append(image, fallback, volumeTag);

    const name = document.createElement("strong");
    name.textContent = product.name;
    const brand = document.createElement("span");
    brand.className = "home-product-brand";
    brand.textContent = product.brand;
    detail.append(imageFrame, name, brand);

    const meta = document.createElement("span");
    meta.className = "home-full-volume";
    meta.textContent = "Frasco inteiro · " + product.ml + " ml";

    const price = document.createElement("strong");
    price.className = "home-product-price";
    price.textContent = currency.format(Number(product.price));

    const add = document.createElement("button");
    add.className = "home-product-add";
    add.type = "button";
    add.textContent = "Adicionar ao carrinho";
    add.addEventListener("click", function () {
      let cart;
      try {
        cart = JSON.parse(window.localStorage.getItem("santino_nobre_cart") || "[]");
      } catch (error) {
        if (status) status.textContent = "Não foi possível ler o carrinho neste navegador.";
        return;
      }
      if (!Array.isArray(cart)) {
        if (status) status.textContent = "O carrinho salvo não está disponível. Abra o catálogo para continuar.";
        return;
      }

      const key = product.id + "-full-" + product.ml;
      const existing = cart.find(function (item) { return item && item.key === key; });
      if (existing) existing.qty = (Number(existing.qty) || 0) + 1;
      else cart.push({
        key: key,
        id: product.id,
        name: product.name,
        brand: product.brand,
        ml: Number(product.ml),
        price: Number(product.price),
        qty: 1,
        category: "Frasco inteiro"
      });

      try {
        window.localStorage.setItem("santino_nobre_cart", JSON.stringify(cart));
      } catch (error) {
        if (status) status.textContent = "Não foi possível salvar no carrinho. Confira as permissões do navegador.";
        return;
      }

      const count = cart.reduce(function (sum, item) {
        return sum + (Number(item && item.qty) || 0);
      }, 0);
      document.querySelectorAll("#homeCartCount").forEach(function (counter) {
        counter.textContent = String(count);
      });
      if (status) status.textContent = product.name + " (" + product.ml + " ml) foi adicionado ao carrinho.";
    });

    const footer = document.createElement("div");
    footer.className = "home-full-product-meta";
    footer.append(meta, price);
    card.append(detail, footer, add);
    grid.append(card);
  });
})();