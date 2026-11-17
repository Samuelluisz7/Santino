(function () {
  "use strict";

  const grid = document.getElementById("homeFeaturedGrid");
  const status = document.getElementById("homeFeaturedStatus");
  const source = document.getElementById("homeFeaturedProducts");
  if (!grid || !source) return;

  const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  let products;
  try {
    products = JSON.parse(source.textContent);
  } catch (error) {
    if (status) status.textContent = "Não foi possível carregar a seleção. Veja o catálogo completo.";
    return;
  }

  if (!Array.isArray(products)) {
    if (status) status.textContent = "Não foi possível carregar a seleção. Veja o catálogo completo.";
    return;
  }

  products.forEach(function (product) {
    if (!product || !product.id || !product.name || !product.brand || !product.image || !product.prices) return;

    const card = document.createElement("article");
    card.className = "home-product-card";

    const detailLink = document.createElement("a");
    detailLink.className = "home-product-detail";
    detailLink.href = "produto.html?id=" + encodeURIComponent(product.id);
    detailLink.setAttribute("aria-label", "Ver detalhes de " + product.name);

    const imageFrame = document.createElement("span");
    imageFrame.className = "home-product-image";
    const image = document.createElement("img");
    image.src = product.image;
    image.alt = "Imagem de referência da fragrância " + product.name + "; o item vendido é o decant em mini frasco SANTINO";
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
    imageFrame.append(image, fallback);

    const name = document.createElement("strong");
    name.textContent = product.name;
    const brand = document.createElement("span");
    brand.className = "home-product-brand";
    brand.textContent = product.brand;
    const concentration = document.createElement("span");
    concentration.className = "home-product-concentration";
    concentration.textContent = product.concentration || "Concentração não informada";
    detailLink.append(imageFrame, name, brand, concentration);

    const controls = document.createElement("div");
    controls.className = "home-product-controls";
    const volumeLabel = document.createElement("label");
    volumeLabel.textContent = "Volume";
    const volume = document.createElement("select");
    volume.setAttribute("aria-label", "Volume de " + product.name);
    [5, 10].forEach(function (ml) {
      const option = document.createElement("option");
      option.value = String(ml);
      option.textContent = ml + " ml";
      volume.append(option);
    });
    volumeLabel.append(volume);

    const price = document.createElement("strong");
    price.className = "home-product-price";
    function updatePrice() {
      price.textContent = currency.format(Number(product.prices[volume.value]));
    }
    volume.addEventListener("change", updatePrice);
    updatePrice();
    controls.append(volumeLabel, price);

    const add = document.createElement("button");
    add.className = "home-product-add";
    add.type = "button";
    add.textContent = "Adicionar ao carrinho";
    add.addEventListener("click", function () {
      const ml = Number(volume.value);
      const amount = Number(product.prices[ml]);
      if (!Number.isFinite(amount)) return;

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

      const key = product.id + "-" + ml;
      const existing = cart.find(function (item) { return item && item.key === key; });
      if (existing) existing.qty = (Number(existing.qty) || 0) + 1;
      else cart.push({
        key: key,
        id: product.id,
        name: product.name,
        brand: product.brand,
        ml: ml,
        price: amount,
        qty: 1,
        category: "Decant",
        image: product.image
      });

      try {
        window.localStorage.setItem("santino_nobre_cart", JSON.stringify(cart));
      } catch (error) {
        if (status) status.textContent = "Não foi possível salvar no carrinho. Confira as permissões do navegador.";
        return;
      }

      const count = cart.reduce(function (sum, item) { return sum + (Number(item && item.qty) || 0); }, 0);
      document.querySelectorAll("#homeCartCount").forEach(function (counter) {
        counter.textContent = String(count);
      });
      window.dispatchEvent(new Event("santino:cart-updated"));
      if (status) status.textContent = product.name + " de " + ml + " ml foi adicionado ao carrinho.";
    });

    card.append(detailLink, controls, add);
    grid.append(card);
  });
})();
