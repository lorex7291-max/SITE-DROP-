(() => {
  "use strict";

  // Dados comerciais ilustrativos. Substitua após configurar catálogo, frete e gateway.
  const SAMPLE_PRODUCT = {
    name: "Kit Organizador Multiuso",
    unitPriceCents: 4990
  };
  const MAX_QUANTITY = 99;
  const formatCurrency = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  });

  const form = document.getElementById("checkout-form");
  const dialog = document.getElementById("review-dialog");
  const zipInput = document.getElementById("zip");
  const phoneInput = document.getElementById("phone");
  const zipFeedback = document.getElementById("zip-feedback");
  const lookupButton = document.getElementById("lookup-zip");
  const qtyMinus = document.getElementById("qty-minus");
  const qtyPlus = document.getElementById("qty-plus");
  const copyButton = document.getElementById("copy-summary");

  let quantity = 1;
  let reviewText = "";

  const digitsOnly = value => String(value).replace(/\D/g, "");
  const currency = cents => formatCurrency.format(cents / 100);

  function updateTotals() {
    const subtotal = SAMPLE_PRODUCT.unitPriceCents * quantity;
    document.getElementById("quantity-value").textContent = String(quantity);
    document.getElementById("items-count").textContent = quantity === 1 ? "1 item" : quantity + " itens";
    document.getElementById("subtotal-value").textContent = currency(subtotal);
    document.getElementById("total-value").textContent = currency(subtotal);
    document.getElementById("mobile-total").textContent = currency(subtotal);
    qtyMinus.disabled = quantity === 1;
    qtyPlus.disabled = quantity === MAX_QUANTITY;
  }

  qtyMinus.addEventListener("click", () => {
    quantity = Math.max(1, quantity - 1);
    updateTotals();
  });
  qtyPlus.addEventListener("click", () => {
    quantity = Math.min(MAX_QUANTITY, quantity + 1);
    updateTotals();
  });

  function formatPhone(value) {
    const d = digitsOnly(value).slice(0, 11);
    if (!d.length) return "";
    if (d.length < 3) return "(" + d;
    if (d.length < 7) return "(" + d.slice(0, 2) + ") " + d.slice(2);
    if (d.length <= 10) {
      return "(" + d.slice(0, 2) + ") " + d.slice(2, 6) + "-" + d.slice(6);
    }
    return "(" + d.slice(0, 2) + ") " + d.slice(2, 7) + "-" + d.slice(7);
  }

  function formatZip(value) {
    const d = digitsOnly(value).slice(0, 8);
    return d.length > 5 ? d.slice(0, 5) + "-" + d.slice(5) : d;
  }

  phoneInput.addEventListener("input", () => {
    phoneInput.value = formatPhone(phoneInput.value);
    phoneInput.removeAttribute("aria-invalid");
  });
  zipInput.addEventListener("input", () => {
    zipInput.value = formatZip(zipInput.value);
    zipInput.removeAttribute("aria-invalid");
    zipFeedback.textContent = "Você também pode preencher o endereço manualmente.";
    zipFeedback.className = "field-hint";
  });

  for (const field of form.querySelectorAll("input, select")) {
    field.addEventListener("input", () => field.removeAttribute("aria-invalid"));
    field.addEventListener("change", () => field.removeAttribute("aria-invalid"));
  }

  function zipStatus(message, type = "") {
    zipFeedback.textContent = message;
    zipFeedback.className = "field-hint" + (type ? " " + type : "");
  }

  lookupButton.addEventListener("click", async () => {
    const zip = digitsOnly(zipInput.value);
    if (zip.length !== 8) {
      zipInput.setAttribute("aria-invalid", "true");
      zipStatus("Informe um CEP com 8 números para fazer a busca.", "error");
      zipInput.focus();
      return;
    }

    lookupButton.disabled = true;
    lookupButton.textContent = "Buscando...";
    zipStatus("Consultando o CEP...");
    try {
      const response = await fetch("https://viacep.com.br/ws/" + zip + "/json/", {
        headers: { "Accept": "application/json" }
      });
      if (!response.ok) throw new Error("Serviço indisponível");
      const address = await response.json();
      if (address.erro) {
        zipStatus("CEP não encontrado. Verifique os números ou preencha manualmente.", "error");
        return;
      }

      const mappedFields = {
        street: address.logradouro,
        neighborhood: address.bairro,
        city: address.localidade,
        state: address.uf
      };
      for (const [fieldId, value] of Object.entries(mappedFields)) {
        if (typeof value === "string" && value.trim()) {
          const field = document.getElementById(fieldId);
          field.value = value;
          field.removeAttribute("aria-invalid");
        }
      }
      zipStatus("Endereço encontrado! Confira e complete os dados.", "success");
      document.getElementById("number").focus();
    } catch {
      zipStatus("Não foi possível consultar agora. Preencha o endereço manualmente.", "error");
    } finally {
      lookupButton.disabled = false;
      lookupButton.textContent = "Buscar";
    }
  });

  function validateForm() {
    const requiredFields = [...form.querySelectorAll("input[required], select[required]")];
    let firstInvalid = null;

    for (const field of requiredFields) {
      const value = field.value.trim();
      let valid = Boolean(value) && field.checkValidity();

      if (field.id === "phone") {
        const phoneLength = digitsOnly(value).length;
        valid = phoneLength === 10 || phoneLength === 11;
      }
      if (field.id === "zip") valid = digitsOnly(value).length === 8;

      if (!valid) {
        field.setAttribute("aria-invalid", "true");
        if (!firstInvalid) firstInvalid = field;
      } else {
        field.removeAttribute("aria-invalid");
      }
    }

    if (firstInvalid) {
      firstInvalid.focus();
      firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
      if (firstInvalid === zipInput) {
        zipStatus("Confira o CEP: ele precisa ter 8 números.", "error");
      }
      return false;
    }
    return true;
  }

  const paymentNames = {
    pix: "Pix",
    cartao: "Cartão de crédito",
    boleto: "Boleto bancário"
  };

  form.addEventListener("submit", event => {
    event.preventDefault();
    if (!validateForm()) return;

    const data = new FormData(form);
    const val = key => String(data.get(key) || "").trim();
    const addressLines = [
      val("street") + ", " + val("number") + (val("complement") ? " — " + val("complement") : ""),
      val("neighborhood") + " · " + val("city") + "/" + val("state"),
      "CEP " + val("zip")
    ];
    const payment = paymentNames[val("payment")] || "Não informado";
    const total = currency(SAMPLE_PRODUCT.unitPriceCents * quantity);

    document.getElementById("review-product").textContent = SAMPLE_PRODUCT.name + " × " + quantity;
    document.getElementById("review-customer").textContent = val("fullName");
    document.getElementById("review-contact").textContent = val("email") + "\n" + val("phone");
    document.getElementById("review-address").textContent = addressLines.join("\n");
    document.getElementById("review-payment").textContent = payment;
    document.getElementById("review-total").textContent = total;
    document.getElementById("copy-feedback").textContent = "";

    reviewText = [
      "UTILIDADES DO LAR — PRÉVIA DE PEDIDO (SEM COBRANÇA)",
      "Produto: " + SAMPLE_PRODUCT.name + " × " + quantity,
      "Cliente: " + val("fullName"),
      "E-mail: " + val("email"),
      "Telefone: " + val("phone"),
      "Endereço: " + addressLines.join(", "),
      "Pagamento desejado: " + payment,
      "Entrega ilustrativa: grátis (sujeita a confirmação)",
      "Total demonstrativo: " + total,
      "Este resumo não representa um pedido confirmado."
    ].join("\n");

    dialog.showModal();
  });

  document.getElementById("close-dialog").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", event => {
    if (event.target === dialog) dialog.close();
  });

  copyButton.addEventListener("click", async () => {
    const feedback = document.getElementById("copy-feedback");
    if (!reviewText) return;

    try {
      if (!navigator.clipboard || !navigator.clipboard.writeText) {
        throw new Error("Clipboard indisponível");
      }
      await navigator.clipboard.writeText(reviewText);
      feedback.textContent = "Resumo copiado com sucesso.";
      feedback.className = "field-hint success";
    } catch {
      feedback.textContent = "Não foi possível copiar automaticamente. Você pode imprimir o resumo.";
      feedback.className = "field-hint error";
    }
  });

  document.getElementById("print-summary").addEventListener("click", () => {
    if (dialog.open) window.print();
  });

  document.getElementById("year").textContent = String(new Date().getFullYear());
  updateTotals();
})();