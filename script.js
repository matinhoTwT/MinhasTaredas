const form = document.getElementById("form_cep");
const campoCep = document.getElementById("cep");
const mensagem = document.getElementById("mensagem");
let requisicaoAtual;
let cepConsultado = "";
const camposEndereco = {
  logradouro: document.getElementById("logradouro"),
  complemento: document.getElementById("complemento"),
  bairro: document.getElementById("bairro"),
  cidade: document.getElementById("cidade"),
  estado: document.getElementById("estado"),
};

campoCep.addEventListener("input", () => {
  const digitos = campoCep.value.replace(/\D/g, "").slice(0, 8);
  campoCep.value = digitos.length > 5
    ? `${digitos.slice(0, 5)}-${digitos.slice(5)}`
    : digitos;
  campoCep.removeAttribute("aria-invalid");

  if (digitos.length === 8) {
    if (cepConsultado !== digitos) {
      buscarCep(digitos);
    }
    return;
  }

  cepConsultado = "";
  requisicaoAtual?.abort();
  requisicaoAtual = undefined;
  limparEndereco();
  mensagem.className = "mensagem";
  mensagem.textContent = "";
});

campoCep.addEventListener("blur", () => {
  const digitos = campoCep.value.replace(/\D/g, "");
  if (digitos.length > 0 && digitos.length !== 8) {
    campoCep.setAttribute("aria-invalid", "true");
    exibirErro("Digite um CEP válido com 8 dígitos.");
  }
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (campoCep.value.replace(/\D/g, "").length !== 8) {
    campoCep.setAttribute("aria-invalid", "true");
    exibirErro("Digite um CEP válido com 8 dígitos.");
  }
});

async function buscarCep(cep) {
  requisicaoAtual?.abort();
  const controller = new AbortController();
  requisicaoAtual = controller;
  cepConsultado = cep;
  limparEndereco();

  mensagem.className = "mensagem";
  mensagem.textContent = "Consultando o CEP...";

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`A consulta falhou (HTTP ${response.status}).`);
    }

    const endereco = await response.json();
    if (requisicaoAtual !== controller) {
      return;
    }
    if (endereco.erro) {
      throw new Error("CEP não encontrado. Confira os números e tente novamente.");
    }

    camposEndereco.logradouro.value = endereco.logradouro || "";
    camposEndereco.complemento.value = endereco.complemento || "";
    camposEndereco.bairro.value = endereco.bairro || "";
    camposEndereco.cidade.value = endereco.localidade || "";
    camposEndereco.estado.value = endereco.uf || "";
    mensagem.className = "mensagem sucesso";
    mensagem.textContent = "Endereço encontrado.";
  } catch (error) {
    if (requisicaoAtual !== controller || (error instanceof Error && error.name === "AbortError")) {
      return;
    }
    const textoErro = error instanceof Error
      ? error.message
      : "Não foi possível consultar o CEP. Tente novamente.";
    exibirErro(textoErro);
    console.error("Erro ao consultar CEP:", error);
  } finally {
    if (requisicaoAtual === controller) {
      requisicaoAtual = undefined;
    }
  }
}

function limparEndereco() {
  Object.values(camposEndereco).forEach((campo) => {
    campo.value = "";
  });
}

function exibirErro(texto) {
  mensagem.className = "mensagem erro";
  mensagem.textContent = texto;
}
