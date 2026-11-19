import { dom, renderizarAviso } from "./state.js";
import { centralizarNoMapa, plotarParadasNoMapa } from "./map.js";

export function renderizarLinhas(linhas, handlers) {
    if (!Array.isArray(linhas) || linhas.length === 0) {
        renderizarAviso("Nenhuma linha encontrada.", "info");
        return;
    }

    dom.listaResultados.innerHTML = "";

    linhas.forEach((linha) => {
        const card = document.createElement("div");
        card.className = "resultado-card border border-[#272b36] rounded-lg p-3 bg-[#12141a] hover:border-[#ed145b] transition";

        const sentidoTexto = linha.sl === 1 ? "Sentido 1 (Principal)" : "Sentido 2 (Secundário)";
        const circularTexto = linha.lc ? " • Circular" : "";

        card.innerHTML = `
            <div class="flex items-center justify-between gap-2">
                <span class="font-bold text-sm text-[#ed145b] bg-[#ed145b]/15 border border-[#ed145b]/30 px-2.5 py-0.5 rounded">${linha.lt}</span>
                <span class="text-[11px] text-slate-400">${sentidoTexto}${circularTexto}</span>
            </div>
            <p class="text-xs text-slate-200 mt-1.5"><strong class="text-slate-400">Principal:</strong> ${linha.tp}</p>
            <p class="text-xs text-slate-300"><strong class="text-slate-400">Secundário:</strong> ${linha.ts}</p>
            <div class="mt-2.5 flex flex-wrap gap-2">
                <button type="button" class="btn-ver-posicao bg-[#ed145b] hover:bg-[#ff1e68] text-white text-xs px-3 py-1.5 rounded font-semibold transition">
                    Ver ônibus no mapa
                </button>
                <button type="button" class="btn-ver-paradas bg-[#181b23] hover:bg-[#222631] text-slate-200 border border-[#2e3340] text-xs px-3 py-1.5 rounded font-medium transition">
                    Ver paradas da linha
                </button>
            </div>
        `;

        card.querySelector(".btn-ver-posicao").addEventListener("click", () => {
            handlers.onVerPosicao(linha);
        });

        card.querySelector(".btn-ver-paradas").addEventListener("click", () => {
            handlers.onVerParadas(linha);
        });

        dom.listaResultados.appendChild(card);
    });
}

export function renderizarListaVeiculos(veiculos, descricaoLinha, onNovaBusca) {
    dom.listaResultados.innerHTML = `
        <div class="flex items-center justify-between mb-1">
            <h2 class="text-xs font-bold uppercase text-slate-400">Veículos em operação (${veiculos.length})</h2>
            <button id="btn-voltar-linhas" type="button" class="text-xs text-[#ed145b] underline font-medium">Nova busca de linha</button>
        </div>
    `;

    document.getElementById("btn-voltar-linhas").addEventListener("click", onNovaBusca);

    veiculos.forEach((v) => {
        const item = document.createElement("div");
        item.className = "resultado-card border border-[#272b36] rounded-lg p-2.5 bg-[#12141a] flex items-center justify-between gap-2 cursor-pointer hover:border-[#ed145b]";
        item.innerHTML = `
            <div>
                <p class="text-xs font-bold text-white">Prefixo ${v.p} ${v.a ? '<span class="text-emerald-400 ml-1">♿ Acessível</span>' : ""}</p>
                <p class="text-[11px] text-slate-400">${descricaoLinha} • Atualizado: ${v.ta || "--:--"}</p>
            </div>
            <span class="text-xs font-semibold text-[#ed145b]">Centralizar</span>
        `;

        item.addEventListener("click", () => {
            centralizarNoMapa(v.py, v.px, 16, true);
        });

        dom.listaResultados.appendChild(item);
    });
}

export function renderizarParadas(paradas, onVerPrevisao) {
    if (!Array.isArray(paradas) || paradas.length === 0) {
        renderizarAviso("Nenhuma parada encontrada.", "info");
        return;
    }

    plotarParadasNoMapa(paradas);
    dom.listaResultados.innerHTML = "";

    paradas.forEach((parada) => {
        const card = document.createElement("div");
        card.className = "resultado-card border border-[#272b36] rounded-lg p-3 bg-[#12141a] hover:border-[#ed145b] transition";
        card.innerHTML = `
            <div class="flex items-center justify-between gap-2">
                <span class="font-bold text-xs text-white">${parada.np}</span>
                <span class="text-[11px] font-mono text-slate-400">Cód: ${parada.cp}</span>
            </div>
            <p class="text-xs text-slate-300 mt-1">${parada.ed || "Endereço não informado"}</p>
            <div class="mt-2 flex flex-wrap gap-2">
                <button type="button" class="btn-previsao bg-[#ed145b] hover:bg-[#ff1e68] text-white text-xs px-3 py-1.5 rounded font-semibold transition">
                    Ver previsão de chegada
                </button>
                <button type="button" class="btn-centralizar-parada bg-[#181b23] hover:bg-[#222631] text-slate-200 border border-[#2e3340] text-xs px-3 py-1.5 rounded font-medium transition">
                    Centralizar no mapa
                </button>
            </div>
        `;

        card.querySelector(".btn-previsao").addEventListener("click", () => {
            centralizarNoMapa(parada.py, parada.px, 16, false);
            onVerPrevisao(parada.cp, parada.np);
        });

        card.querySelector(".btn-centralizar-parada").addEventListener("click", () => {
            centralizarNoMapa(parada.py, parada.px, 16, true);
        });

        dom.listaResultados.appendChild(card);
    });
}

export function renderizarPrevisoes(nomePonto, previsoes) {
    if (previsoes.length === 0) {
        renderizarAviso("Sem previsão de chegada no momento para este ponto.", "aviso");
        return;
    }

    dom.listaResultados.innerHTML = `<h2 class="text-xs font-bold uppercase text-slate-400 mb-1">Próximos ônibus em ${nomePonto}</h2>`;

    previsoes.forEach((item) => {
        const card = document.createElement("div");
        card.className = "resultado-card border border-[#272b36] rounded-lg p-2.5 bg-[#12141a] flex items-center justify-between gap-2";
        card.innerHTML = `
            <div>
                <span class="font-bold text-xs text-[#ed145b] bg-[#ed145b]/15 border border-[#ed145b]/30 px-2 py-0.5 rounded">${item.letreiro}</span>
                <span class="text-xs font-semibold text-white ml-1">Carro ${item.prefixo}</span>
                ${item.acessivel ? '<span class="text-xs text-emerald-400 ml-1">♿</span>' : ""}
                <p class="text-[11px] text-slate-400 mt-1">${item.sentido}</p>
            </div>
            <div class="text-right">
                <span class="text-sm font-bold text-white">${item.chegada}</span>
                <p class="text-[10px] text-slate-400">previsto</p>
            </div>
        `;
        dom.listaResultados.appendChild(card);
    });
}

export function renderizarCorredores(corredores) {
    if (!Array.isArray(corredores) || corredores.length === 0) {
        renderizarAviso("Nenhum corredor retornado pela API.", "aviso");
        return;
    }

    dom.listaResultados.innerHTML = `<h2 class="text-xs font-bold uppercase text-slate-400 mb-1">Corredores cadastrados (${corredores.length})</h2>`;

    corredores.forEach((c) => {
        const card = document.createElement("div");
        card.className = "resultado-card border border-[#272b36] rounded-lg p-2.5 bg-[#12141a]";
        card.innerHTML = `
            <p class="text-xs font-bold text-white">${c.nc || "Corredor"}</p>
            <p class="text-[11px] text-slate-400">Código: ${c.cc}</p>
        `;
        dom.listaResultados.appendChild(card);
    });
}