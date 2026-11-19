import { state, dom, definirPainelRecolhido } from "./state.js";
import { limparMapa, plotarVeiculosNoMapa, invalidarTamanhoMapa } from "./map.js";
import { renderizarListaVeiculos } from "./ui.js";
import {
    autenticarToken,
    buscarLinhas,
    carregarPosicaoLinha,
    buscarParadas,
    carregarPrevisaoParada,
    carregarCorredores
} from "./sptrans.js";

// Token salvo localmente (se houver)
const tokenSalvo = localStorage.getItem("sptrans_token");
if (tokenSalvo && dom.tokenInput) {
    dom.tokenInput.value = tokenSalvo;
}

// Alto contraste
function alternarAltoContraste() {
    document.body.classList.toggle("alto-contraste");
}

dom.btnAcessibilidade?.addEventListener("click", alternarAltoContraste);
dom.btnAcessibilidadeLogin?.addEventListener("click", alternarAltoContraste);

// Aba flutuante no celular
dom.btnTogglePainel?.addEventListener("click", () => {
    const estaRecolhido = dom.asidePainel.classList.contains("recolhido");
    definirPainelRecolhido(!estaRecolhido, invalidarTamanhoMapa);
});

// Alternância de abas
function ativarAba(abaAtiva) {
    [dom.tabLinhas, dom.tabParadas, dom.tabCorredores].forEach((btn) => {
        btn.classList.remove("border-[#ed145b]", "text-[#ed145b]", "bg-[#12141a]");
        btn.classList.add("border-transparent", "text-slate-400");
    });

    abaAtiva.classList.remove("border-transparent", "text-slate-400");
    abaAtiva.classList.add("border-[#ed145b]", "text-[#ed145b]", "bg-[#12141a]");

    dom.painelLinhas.classList.toggle("hidden", abaAtiva !== dom.tabLinhas);
    dom.painelParadas.classList.toggle("hidden", abaAtiva !== dom.tabParadas);
    dom.painelCorredores.classList.toggle("hidden", abaAtiva !== dom.tabCorredores);

    definirPainelRecolhido(false, invalidarTamanhoMapa);
}

dom.tabLinhas.addEventListener("click", () => ativarAba(dom.tabLinhas));
dom.tabParadas.addEventListener("click", () => ativarAba(dom.tabParadas));
dom.tabCorredores.addEventListener("click", () => ativarAba(dom.tabCorredores));

// Limpar mapa
dom.btnLimparMapa.addEventListener("click", limparMapa);

// Tela inicial de token
function mostrarErroToken(mensagem) {
    if (!dom.erroToken) return;
    dom.erroToken.textContent = mensagem;
    dom.erroToken.classList.remove("hidden");
}

function esconderErroToken() {
    if (!dom.erroToken) return;
    dom.erroToken.textContent = "";
    dom.erroToken.classList.add("hidden");
}

function abrirAplicacaoPrincipal() {
    dom.telaToken?.remove();
    if (dom.appPrincipal) {
        dom.appPrincipal.classList.remove("hidden");
        dom.appPrincipal.classList.add("flex");
    }
    setTimeout(() => invalidarTamanhoMapa(), 100);
}

dom.btnAutenticar.addEventListener("click", async () => {
    const token = dom.tokenInput.value.trim();
    esconderErroToken();

    if (!token) {
        mostrarErroToken("Informe o token da API SPTrans antes de entrar.");
        return;
    }

    dom.btnAutenticar.disabled = true;
    dom.btnAutenticar.textContent = "Autenticando...";

    try {
        await autenticarToken(
            token,
            () => abrirAplicacaoPrincipal(),
            (msgErro) => {
                dom.btnAutenticar.disabled = false;
                dom.btnAutenticar.textContent = "Entrar";
                mostrarErroToken(msgErro);
            }
        );
    } catch (error) {
        console.error(error);
        dom.btnAutenticar.disabled = false;
        dom.btnAutenticar.textContent = "Entrar";
        mostrarErroToken("Falha ao autenticar. Verifique o token e se o servidor está rodando com o proxy /api.");
    }
});

dom.tokenInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") dom.btnAutenticar.click();
});

// Eventos de linhas, paradas e corredores
dom.btnBuscarLinha.addEventListener("click", buscarLinhas);
dom.buscaLinhaInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") buscarLinhas();
});

dom.filtroAcessiveis.addEventListener("change", () => {
    if (state.ultimosVeiculos.length > 0 && state.linhaSelecionada) {
        const desc = `${state.linhaSelecionada.lt} — ${state.linhaSelecionada.tp}`;
        plotarVeiculosNoMapa(state.ultimosVeiculos, desc, (filtrados, d) => {
            renderizarListaVeiculos(filtrados, d, buscarLinhas);
        });
    }
});

dom.autoRefreshToggle.addEventListener("change", () => {
    if (state.timerAtualizacao) {
        clearInterval(state.timerAtualizacao);
        state.timerAtualizacao = null;
    }

    if (dom.autoRefreshToggle.checked) {
        state.timerAtualizacao = setInterval(() => {
            if (state.autenticado && state.linhaSelecionada) {
                carregarPosicaoLinha(
                    state.linhaSelecionada.cl,
                    `${state.linhaSelecionada.lt} — ${state.linhaSelecionada.tp}`
                );
            }
        }, 30000);
    }
});

dom.btnBuscarParada.addEventListener("click", buscarParadas);
dom.buscaParadaInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") buscarParadas();
});

dom.btnPrevisaoDireta.addEventListener("click", () => {
    carregarPrevisaoParada(dom.codigoParadaDireto.value.trim());
});

dom.btnCarregarCorredores.addEventListener("click", carregarCorredores);