/* SANTINO — registra somente o termo digitado e a data gerada pelo banco.
   A chave sb_publishable é pública; a proteção real está nas permissões e na RLS. */
(function () {
  "use strict";

  const SUPABASE_URL = "https://optloyhbkkrptuwsizrc.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_pht-hePlTrWZlBr8gsZGYA__c56gemG";
  const MAX_TERM_LENGTH = 100;

  document.addEventListener("submit", async function (event) {
    const form = event.target.closest("form[data-santino-search]");
    if (!form) return;

    event.preventDefault();

    const input = form.querySelector('input[name="q"]');
    const term = String(input && input.value || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, MAX_TERM_LENGTH);

    if (!term) {
      if (input) input.focus();
      return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    const previousLabel = submitButton ? submitButton.textContent : "";
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Buscando…";
    }

    const destination = new URL(form.getAttribute("action") || "buscar.html", window.location.href);
    destination.searchParams.set("q", term);

    try {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 2500);

      try {
        const response = await fetch(SUPABASE_URL + "/rest/v1/pesquisas_santino", {
          method: "POST",
          headers: {
            "apikey": SUPABASE_PUBLISHABLE_KEY,
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
          },
          body: JSON.stringify({ termo: term }),
          signal: controller.signal,
          keepalive: true
        });

        if (!response.ok) {
          console.warn("SANTINO: a pesquisa foi exibida, mas não foi registrada no Supabase. HTTP", response.status);
        }
      } catch (error) {
        console.warn("SANTINO: não foi possível registrar a pesquisa; a navegação continuará.", error);
      } finally {
        window.clearTimeout(timeoutId);
      }
    } finally {
      window.location.assign(destination.href);
    }
  });
})();