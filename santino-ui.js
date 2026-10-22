/* SANTINO — comportamento compartilhado entre as páginas. */
(function () {
  "use strict";

  const file = (window.location.pathname.split("/").pop() || "index.html").split("?")[0];
  const params = new URLSearchParams(window.location.search);
  let activePage = file || "index.html";

  if (activePage === "produto.html") {
    activePage = (params.get("id") || "").startsWith("full-") ? "frascos.html" : "decants.html";
    if ((params.get("id") || "").startsWith("full-")) {
      document.body.classList.add("full-size-mode");
    }
  }

  document.querySelectorAll("header nav a[href], .catalog-nav a[href], .nav-links a[href]").forEach(function (link) {
    const href = (link.getAttribute("href") || "").split("?")[0];
    const known = ["index.html", "decants.html", "frascos.html", "kits.html"];
    if (!known.includes(href)) return;

    if (href === activePage) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });

  try {
    const stored = JSON.parse(window.localStorage.getItem("santino_nobre_cart") || "[]");
    const count = Array.isArray(stored) ? stored.reduce(function (sum, item) {
      return sum + (Number(item && item.qty) || 0);
    }, 0) : 0;
    document.querySelectorAll("#homeCartCount, #cartCount, #searchCartCount, #policyCartCount").forEach(function (counter) {
      counter.textContent = String(count);
    });
  } catch (error) {
    /* A loja continua navegável se o armazenamento estiver indisponível. */
  }

  document.querySelectorAll('label.quantity-label').forEach(function (label) {
    label.childNodes.forEach(function (node) {
      if (node.nodeType === Node.TEXT_NODE && node.textContent.trim() === "Qtd.") {
        node.textContent = "Quantidade";
      }
    });
  });
})();