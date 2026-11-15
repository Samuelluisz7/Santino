(function attachStickyPurchase(global) {
  "use strict";

  function formatSummary(selection, formatPrice) {
    const parts = [];
    const volume = Number(selection && selection.volume);
    const quantity = Number(selection && selection.quantity);

    if (Number.isFinite(volume) && volume > 0) {
      parts.push(volume + " ml");
    }
    if (Number.isFinite(quantity) && quantity > 1) {
      parts.push("Qtd. " + quantity);
    }
    if (selection && selection.consultation) {
      parts.push("Preço sob consulta");
    } else if (selection && Number.isFinite(selection.price) && typeof formatPrice === "function") {
      parts.push(formatPrice(selection.price));
    }

    return parts.join(" · ");
  }

  function init(options) {
    const settings = options || {};
    const bar = settings.bar;
    const button = settings.button;
    const sourceButton = settings.sourceButton;
    const nameTarget = settings.nameTarget;
    const summaryTarget = settings.summaryTarget;
    const getSelection = settings.getSelection;
    const formatPrice = settings.formatPrice;

    if (!bar || !button || !sourceButton || !nameTarget || !summaryTarget || typeof getSelection !== "function") {
      return null;
    }

    function isMobile() {
      if (typeof global.matchMedia === "function") {
        return global.matchMedia("(max-width: 760px)").matches;
      }
      return Number(global.innerWidth) <= 760;
    }

    function setVisible(sourceIsVisible) {
      const show = !sourceIsVisible && isMobile();
      bar.classList.toggle("is-visible", show);
      bar.setAttribute("aria-hidden", String(!show));
    }

    function updateContent() {
      const selection = getSelection() || {};
      nameTarget.textContent = String(selection.name || "");
      summaryTarget.textContent = formatSummary(selection, formatPrice);
      button.textContent = selection.consultation ? "Consultar" : "Adicionar";
    }

    function updateVisibility() {
      const rect = sourceButton.getBoundingClientRect();
      const sourceIsVisible = rect.bottom > 0 && rect.top < Number(global.innerHeight);
      setVisible(sourceIsVisible);
    }

    const handleClick = function () {
      sourceButton.click();
    };
    button.addEventListener("click", handleClick);

    let observer = null;
    if (typeof global.IntersectionObserver === "function") {
      observer = new global.IntersectionObserver(function (entries) {
        const entry = entries && entries[0];
        if (entry) setVisible(Boolean(entry.isIntersecting));
      }, { threshold: 0 });
      observer.observe(sourceButton);
    } else {
      global.addEventListener("scroll", updateVisibility, { passive: true });
    }
    global.addEventListener("resize", updateVisibility);

    updateContent();
    updateVisibility();

    return {
      refresh: function () {
        updateContent();
        updateVisibility();
      },
      destroy: function () {
        if (observer) observer.disconnect();
        global.removeEventListener("scroll", updateVisibility);
        global.removeEventListener("resize", updateVisibility);
        button.removeEventListener("click", handleClick);
        setVisible(true);
      },
    };
  }

  global.SantinoStickyPurchase = Object.freeze({
    formatSummary: formatSummary,
    init: init,
  });
})(window);
