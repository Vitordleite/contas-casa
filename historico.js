// Histórico copiado à mão da app SmartThings (Monitorização energética), em kWh.
// Fica separado das leituras automáticas do PC (que são calculadas pela app).
// Para acrescentar mais dados, basta juntar linhas nos blocos abaixo.
export const HIST_ST = {
  atualizado: '2026-11-22 11:01',
  // sala: kWh por mês (novembro é parcial: do dia 1 até à data acima)
  meses: { sala: { '2026-08': 4.0, '2026-09': 11.4, '2026-10': 3.6, '2026-11': 26.5 } },
  // sala: kWh por semana (chave = primeiro dia da semana)
  semanas: { sala: { '2026-11-01': 3.8, '2026-11-08': 8.9, '2026-11-15': 12.7, '2026-11-22': 1.0 } },
  // sala: kWh por dia (22/11 é parcial)
  dias: { sala: { '2026-11-19': 1.9, '2026-11-20': 2.6, '2026-11-21': 4.9, '2026-11-22': 1.0 } },
};
