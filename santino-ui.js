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

  function updateCartCounters() {
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
  }
  updateCartCounters();

  document.querySelectorAll('label.quantity-label').forEach(function (label) {
    label.childNodes.forEach(function (node) {
      if (node.nodeType === Node.TEXT_NODE && node.textContent.trim() === "Qtd.") {
        node.textContent = "Quantidade";
      }
    });
  });

  document.querySelectorAll(".toast").forEach(function (toast) {
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
  });

  /* CTA persistente: transforma a intenção de compra em atendimento imediato. */
  if (!document.querySelector("[data-santino-whatsapp]") && !/wa\.me/.test(window.location.href)) {
    const link = document.createElement("a");
    link.href = "https://wa.me/5531996312579?text=" + encodeURIComponent("Olá! Vim pelo site da SANTINO e gostaria de ajuda para escolher uma fragrância.");
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.className = "santino-whatsapp-float";
    link.dataset.santinoWhatsapp = "true";
    link.setAttribute("aria-label", "Falar com a SANTINO pelo WhatsApp");
    link.innerHTML = '<span aria-hidden="true">◌</span><b>Fale conosco</b>';
    document.body.appendChild(link);
  }
})();
