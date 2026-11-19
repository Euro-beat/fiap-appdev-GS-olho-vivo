import { BASE_URL, state, dom, apiGet, renderizarAviso, definirContexto, definirPainelRecolhido } from "./state.js";
import { camadaOnibus, camadaParadas, plotarVeiculosNoMapa, invalidarTamanhoMapa } from "./map.js";
import {
    renderizarLinhas,
    renderizarListaVeiculos,
    renderizarParadas,
    renderizarPrevisoes,
    renderizarCorredores
} from "./ui.js";

function tratarErroConsulta(error, msgPadrao, msg404 = null) {
    console.error(error);
    if (error.message === "SESSAO_EXPIRADA") {
        renderizarAviso("Sua sessão com a SPTrans expirou. Recarregue a página para autenticar novamente.", "erro");
        return;
    }
    if (error.status === 404 && msg404) {
        renderizarAviso(msg404, "aviso");
        return;
    }
    renderizarAviso(msgPadrao, "erro");
}

export async function autenticarToken(token, onSucesso, onErro) {
    const response = await fetch(`${BASE_URL}/Login/Autenticar?token=${encodeURIComponent(token)}`, {
        method: "POST",
        credentials: "include"
    });

    const texto = (await response.text()).trim().toLowerCase();

    if (response.ok && texto === "true") {
        state.autenticado = true;
        localStorage.setItem("sptrans_token", token);

        if (dom.statusConexao) {
            dom.statusConexao.textContent = "🟢 Conectado";
            dom.statusConexao.className = "text-xs bg-emerald-700 text-white px-3 py-1.5 rounded-full font-medium";
        }

        [
            dom.buscaLinhaInput,
            dom.btnBuscarLinha,
            dom.buscaParadaInput,
            dom.btnBuscarParada,
            dom.codigoParadaDireto,
            dom.btnPrevisaoDireta,
            dom.btnCarregarCorredores
        ].forEach((el) => {
            if (el) el.disabled = false;
        });

        renderizarAviso("Autenticado! Busque uma linha, um ponto de parada ou liste os corredores.", "info");
        if (typeof onSucesso === "function") onSucesso();
    } else {
        state.autenticado = false;
        if (typeof onErro === "function") {
            onErro("Falha ao autenticar. Verifique o token e se o servidor está rodando com o proxy /api.");
        }
    }
}

export async function buscarLinhas() {
    if (!state.autenticado) return;
    const termo = dom.buscaLinhaInput.value.trim();
    if (!termo) return;

    definirPainelRecolhido(false, invalidarTamanhoMapa);
    renderizarAviso(`Buscando linhas para "${termo}"...`, "info");

    try {
        const linhas = await apiGet(`/Linha/Buscar?termosBusca=${encodeURIComponent(termo)}`);
        renderizarLinhas(linhas, {
            onVerPosicao: (linha) => {
                state.linhaSelecionada = linha;
                carregarPosicaoLinha(linha.cl, `${linha.lt} — ${linha.tp}`);
            },
            onVerParadas: (linha) => {
                state.linhaSelecionada = linha;
                carregarParadasPorLinha(linha.cl, `${linha.lt} — ${linha.tp}`);
            }
        });
    } catch (error) {
        tratarErroConsulta(error, "Não foi possível carregar as linhas.");
    }
}

export async function carregarPosicaoLinha(codigoLinha, descricaoLinha) {
    renderizarAviso(`Consultando posição dos ônibus da linha ${descricaoLinha}...`, "info");

    try {
        const dados = await apiGet(`/Posicao/Linha?codigoLinha=${encodeURIComponent(codigoLinha)}`);

        if (!dados) {
            state.ultimosVeiculos = [];
            camadaOnibus.clearLayers();
            definirContexto(`Linha ${descricaoLinha} • Sem dados de posição no momento`);
            renderizarAviso(
                "A API não retornou posições ativas para esta linha agora (comum fora do horário de pico ou na madrugada).",
                "aviso"
            );
            return;
        }

        const veiculos = Array.isArray(dados.vs) ? dados.vs : [];
        state.ultimosVeiculos = veiculos;

        definirContexto(`Linha ${descricaoLinha} • Hora: ${dados.hr || "--:--"} • ${veiculos.length} veículo(s)`);

        if (veiculos.length === 0) {
            camadaOnibus.clearLayers();
            renderizarAviso(
                `Nenhum veículo em operação no momento (${dados.hr || "agora"}) para a linha ${descricaoLinha}.`,
                "aviso"
            );
            return;
        }

        plotarVeiculosNoMapa(veiculos, descricaoLinha, (filtrados, desc) => {
            renderizarListaVeiculos(filtrados, desc, buscarLinhas);
        });
    } catch (error) {
        camadaOnibus.clearLayers();
        tratarErroConsulta(
            error,
            "Não foi possível consultar a posição dos ônibus agora (possível instabilidade da API ou indisponibilidade no horário).",
            "Sem registros de posição disponíveis para esta linha neste horário."
        );
    }
}

export async function buscarParadas() {
    if (!state.autenticado) return;
    const termo = dom.buscaParadaInput.value.trim();
    if (!termo) return;

    definirPainelRecolhido(false, invalidarTamanhoMapa);
    renderizarAviso(`Buscando paradas para "${termo}"...`, "info");

    try {
        const paradas = await apiGet(`/Parada/Buscar?termosBusca=${encodeURIComponent(termo)}`);
        renderizarParadas(paradas, carregarPrevisaoParada);
    } catch (error) {
        tratarErroConsulta(error, "Erro ao buscar paradas.");
    }
}

export async function carregarParadasPorLinha(codigoLinha, descricaoLinha) {
    renderizarAviso(`Carregando paradas da linha ${descricaoLinha}...`, "info");

    try {
        const paradas = await apiGet(`/Parada/BuscarParadasPorLinha?codigoLinha=${encodeURIComponent(codigoLinha)}`);
        const listaParadas = Array.isArray(paradas) ? paradas : [];

        if (listaParadas.length === 0) {
            camadaParadas.clearLayers();
            definirContexto(`Paradas da linha ${descricaoLinha} (0)`);
            renderizarAviso(
                "Nenhuma parada retornada para esta linha neste momento (pode haver restrição por horário ou linha sem pontos ativos na consulta).",
                "aviso"
            );
            return;
        }

        definirContexto(`Paradas da linha ${descricaoLinha} (${listaParadas.length})`);
        renderizarParadas(listaParadas, carregarPrevisaoParada);
    } catch (error) {
        camadaParadas.clearLayers();
        tratarErroConsulta(
            error,
            "Não foi possível carregar as paradas da linha agora (verifique o console ou tente novamente em outro horário).",
            "Paradas não encontradas para esta linha no momento."
        );
    }
}

export async function carregarPrevisaoParada(codigoParada, nomePontoFallback = "") {
    if (!state.autenticado || !codigoParada) return;

    definirPainelRecolhido(false, invalidarTamanhoMapa);
    renderizarAviso(`Consultando previsões para o ponto ${codigoParada}...`, "info");

    try {
        const dados = await apiGet(`/Previsao/Parada?codigoParada=${encodeURIComponent(codigoParada)}`);
        const ponto = (dados && dados.p) || {};
        const linhasPrev = Array.isArray(ponto.l) ? ponto.l : [];
        const nomePonto = ponto.np || nomePontoFallback || `Ponto ${codigoParada}`;

        definirContexto(`Previsão • ${nomePonto} • Hora consulta: ${(dados && dados.hr) || "--:--"}`);

        const previsoes = [];
        linhasPrev.forEach((l) => {
            const veiculos = Array.isArray(l.vs) ? l.vs : [];
            veiculos.forEach((v) => {
                previsoes.push({
                    letreiro: l.c,
                    sentido: `${l.lt0 || ""} → ${l.lt1 || ""}`,
                    prefixo: v.p,
                    chegada: v.t,
                    acessivel: Boolean(v.a)
                });
            });
        });

        renderizarPrevisoes(nomePonto, previsoes);
    } catch (error) {
        tratarErroConsulta(error, "Erro ao consultar previsão do ponto.");
    }
}

export async function carregarCorredores() {
    if (!state.autenticado) return;
    definirPainelRecolhido(false, invalidarTamanhoMapa);
    renderizarAviso("Carregando corredores...", "info");

    try {
        const corredores = await apiGet("/Corredor");
        renderizarCorredores(corredores);
    } catch (error) {
        tratarErroConsulta(error, "Erro ao carregar corredores.");
    }
}