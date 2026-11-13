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
    link.innerHTML = '<span class="whatsapp-mark" aria-hidden="true"><svg viewBox="0 0 32 32" focusable="false"><path fill="currentColor" d="M16.02 3.2A12.72 12.72 0 0 0 5.1 22.43L3.4 28.7l6.42-1.68A12.72 12.72 0 1 0 16.02 3.2Zm0 23.1c-2 0-3.96-.54-5.66-1.57l-.4-.24-3.8 1 .99-3.7-.26-.42A10.36 10.36 0 1 1 16.02 26.3Zm5.69-7.76c-.31-.16-1.83-.9-2.11-1-.28-.1-.49-.16-.69.16-.2.31-.79 1-.97 1.2-.18.2-.36.23-.67.08-.31-.16-1.31-.48-2.5-1.53-.92-.82-1.54-1.83-1.72-2.14-.18-.31-.02-.48.14-.63.14-.14.31-.36.47-.54.16-.18.2-.31.31-.52.1-.2.05-.39-.03-.55-.08-.15-.69-1.67-.95-2.29-.25-.6-.5-.52-.69-.53h-.59c-.2 0-.54.08-.82.39-.28.31-1.08 1.05-1.08 2.57s1.1 2.98 1.26 3.19c.15.2 2.17 3.32 5.26 4.66.73.31 1.3.5 1.74.64.73.23 1.4.2 1.93.12.59-.09 1.83-.75 2.09-1.47.26-.72.26-1.34.18-1.47-.08-.13-.28-.2-.59-.36Z"/></svg></span><b>Fale conosco</b>';
    document.body.appendChild(link);
  }
})();
