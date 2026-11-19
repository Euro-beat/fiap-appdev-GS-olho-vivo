export const BASE_URL = "/api";

export const state = {
    autenticado: false,
    linhaSelecionada: null,
    ultimosVeiculos: [],
    timerAtualizacao: null
};

export const dom = {
    telaToken: document.getElementById("tela-token"),
    appPrincipal: document.getElementById("app-principal"),
    tokenInput: document.getElementById("token-input"),
    btnAutenticar: document.getElementById("btn-autenticar"),
    erroToken: document.getElementById("erro-token"),

    statusConexao: document.getElementById("status-conexao"),
    btnAcessibilidade: document.getElementById("btn-acessibilidade"),
    btnAcessibilidadeLogin: document.getElementById("btn-acessibilidade-login"),

    asidePainel: document.querySelector("aside"),
    btnTogglePainel: document.getElementById("btn-toggle-painel"),

    tabLinhas: document.getElementById("tab-linhas"),
    tabParadas: document.getElementById("tab-paradas"),
    tabCorredores: document.getElementById("tab-corredores"),

    painelLinhas: document.getElementById("painel-linhas"),
    painelParadas: document.getElementById("painel-paradas"),
    painelCorredores: document.getElementById("painel-corredores"),

    buscaLinhaInput: document.getElementById("busca-linha-input"),
    btnBuscarLinha: document.getElementById("btn-buscar-linha"),
    filtroAcessiveis: document.getElementById("filtro-acessiveis"),
    autoRefreshToggle: document.getElementById("auto-refresh-toggle"),

    buscaParadaInput: document.getElementById("busca-parada-input"),
    btnBuscarParada: document.getElementById("btn-buscar-parada"),
    codigoParadaDireto: document.getElementById("codigo-parada-direto"),
    btnPrevisaoDireta: document.getElementById("btn-previsao-direta"),

    btnCarregarCorredores: document.getElementById("btn-carregar-corredores"),
    barraContexto: document.getElementById("barra-contexto"),
    textoContexto: document.getElementById("texto-contexto"),
    btnLimparMapa: document.getElementById("btn-limpar-mapa"),
    listaResultados: document.getElementById("lista-resultados")
};

export function renderizarAviso(mensagem, tipo = "info") {
    const cores = {
        info: "text-slate-400",
        aviso: "text-amber-300 bg-amber-950/50 border border-amber-500/40 rounded-lg p-3",
        erro: "text-[#ff7aa4] bg-[#ed145b]/15 border border-[#ed145b]/50 rounded-lg p-3"
    };
    const classe = cores[tipo] || cores.info;
    dom.listaResultados.innerHTML = `<p class="text-sm ${classe} text-center my-4">${mensagem}</p>`;
}

export function definirContexto(mensagem) {
    dom.textoContexto.textContent = mensagem;
    dom.barraContexto.classList.remove("hidden");
}

export function definirPainelRecolhido(recolher, invalidarMapaFn) {
    if (!dom.asidePainel || window.innerWidth >= 768) return;
    dom.asidePainel.classList.toggle("recolhido", recolher);
    if (dom.btnTogglePainel) {
        dom.btnTogglePainel.textContent = recolher ? "Abrir painel" : "Minimizar painel";
    }
    if (typeof invalidarMapaFn === "function") {
        setTimeout(() => invalidarMapaFn(), 260);
    }
}

export async function apiGet(caminho) {
    const response = await fetch(`${BASE_URL}${caminho}`, {
        method: "GET",
        credentials: "include"
    });

    if (response.status === 401) {
        state.autenticado = false;
        if (dom.statusConexao) {
            dom.statusConexao.textContent = "🔴 Sessão expirada";
            dom.statusConexao.className = "text-xs bg-red-900 text-white px-3 py-1.5 rounded-full font-medium";
        }
        throw new Error("SESSAO_EXPIRADA");
    }

    if (!response.ok) {
        const erro = new Error(`Falha HTTP ${response.status}`);
        erro.status = response.status;
        throw erro;
    }

    const texto = await response.text();
    if (!texto || !texto.trim()) {
        return null;
    }

    try {
        return JSON.parse(texto);
    } catch {
        return null;
    }
}