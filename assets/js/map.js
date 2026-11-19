import { state, dom, renderizarAviso, definirPainelRecolhido } from "./state.js";

export const map = L.map("map").setView([-23.55052, -46.633308], 13);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

export const camadaOnibus = L.layerGroup().addTo(map);
export const camadaParadas = L.layerGroup().addTo(map);

export function invalidarTamanhoMapa() {
    map.invalidateSize();
}

export function centralizarNoMapa(lat, lng, zoom = 16, recolherNoMobile = false) {
    if (typeof lat === "number" && typeof lng === "number") {
        map.setView([lat, lng], zoom);
        if (recolherNoMobile) {
            definirPainelRecolhido(true, invalidarTamanhoMapa);
        }
    }
}

export function limparMapa() {
    camadaOnibus.clearLayers();
    camadaParadas.clearLayers();
    state.linhaSelecionada = null;
    state.ultimosVeiculos = [];

    dom.buscaLinhaInput.value = "";
    dom.buscaParadaInput.value = "";
    dom.codigoParadaDireto.value = "";

    dom.barraContexto.classList.add("hidden");
    dom.textoContexto.textContent = "";

    renderizarAviso(
        "Mapa e pesquisas limpos. Faça uma nova busca de linha, ponto de parada ou corredor.",
        "info"
    );
}

export function plotarVeiculosNoMapa(veiculos, descricaoLinha, aoPlotarLista) {
    camadaOnibus.clearLayers();

    const filtrados = dom.filtroAcessiveis.checked
        ? veiculos.filter((v) => Boolean(v.a))
        : veiculos;

    if (filtrados.length === 0) {
        renderizarAviso("Nenhum veículo encontrado para o filtro selecionado.", "aviso");
        return;
    }

    const bounds = [];

    filtrados.forEach((v) => {
        if (typeof v.py !== "number" || typeof v.px !== "number") return;

        const marcador = L.circleMarker([v.py, v.px], {
            radius: 8,
            color: "#ffffff",
            weight: 1.5,
            fillColor: v.a ? "#10b981" : "#ed145b",
            fillOpacity: 0.95
        });

        marcador.bindPopup(`
            <div class="text-xs space-y-1">
                <p><strong>Linha:</strong> ${descricaoLinha}</p>
                <p><strong>Prefixo:</strong> ${v.p}</p>
                <p><strong>Acessível:</strong> ${v.a ? "Sim (♿)" : "Não informado"}</p>
                <p><strong>Última leitura:</strong> ${v.ta || "Agora"}</p>
            </div>
        `);

        marcador.addTo(camadaOnibus);
        bounds.push([v.py, v.px]);
    });

    if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
    }

    if (typeof aoPlotarLista === "function") {
        aoPlotarLista(filtrados, descricaoLinha);
    }
}

export function plotarParadasNoMapa(paradas) {
    camadaParadas.clearLayers();
    const bounds = [];

    paradas.forEach((parada) => {
        if (typeof parada.py !== "number" || typeof parada.px !== "number") return;

        const marker = L.circleMarker([parada.py, parada.px], {
            radius: 6,
            color: "#1d4ed8",
            weight: 2,
            fillColor: "#3b82f6",
            fillOpacity: 0.85
        });

        marker.bindPopup(`
            <div class="text-xs space-y-1">
                <p><strong>${parada.np}</strong></p>
                <p>Código: ${parada.cp}</p>
                <p>${parada.ed || ""}</p>
            </div>
        `);

        marker.addTo(camadaParadas);
        bounds.push([parada.py, parada.px]);
    });

    if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
    }
}