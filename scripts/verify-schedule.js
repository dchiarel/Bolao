#!/usr/bin/env node
// Verifica se data.js está com os horários da Copa 2026 convertidos para BRT (UTC-3).
// Referência: tabela de partidas da Copa do Mundo FIFA 2026 (footballbox/Wikipedia),
// com cada horário local do estádio convertido para America/Sao_Paulo/UTC-3.

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const dataPath = path.join(root, 'data.js');
const source = fs.readFileSync(dataPath, 'utf8') + `
this.GRUPOS_COPA_2026 = GRUPOS_COPA_2026;
this.KNOCKOUT_STAGES_2026 = KNOCKOUT_STAGES_2026;`;
const ctx = {};
vm.createContext(ctx);
vm.runInContext(source, ctx, { filename: dataPath });

const expected = {
  "a1": {
    "data": "2026-06-11",
    "hora": "16:00"
  },
  "a2": {
    "data": "2026-06-11",
    "hora": "23:00"
  },
  "a3": {
    "data": "2026-06-18",
    "hora": "13:00"
  },
  "a4": {
    "data": "2026-06-18",
    "hora": "22:00"
  },
  "a5": {
    "data": "2026-06-24",
    "hora": "22:00"
  },
  "a6": {
    "data": "2026-06-24",
    "hora": "22:00"
  },
  "b1": {
    "data": "2026-06-12",
    "hora": "16:00"
  },
  "b2": {
    "data": "2026-06-13",
    "hora": "16:00"
  },
  "b3": {
    "data": "2026-06-18",
    "hora": "19:00"
  },
  "b4": {
    "data": "2026-06-18",
    "hora": "16:00"
  },
  "b5": {
    "data": "2026-06-24",
    "hora": "16:00"
  },
  "b6": {
    "data": "2026-06-24",
    "hora": "16:00"
  },
  "c1": {
    "data": "2026-06-13",
    "hora": "19:00"
  },
  "c2": {
    "data": "2026-06-13",
    "hora": "22:00"
  },
  "c3": {
    "data": "2026-06-19",
    "hora": "19:00"
  },
  "c4": {
    "data": "2026-06-19",
    "hora": "21:30"
  },
  "c5": {
    "data": "2026-06-24",
    "hora": "19:00"
  },
  "c6": {
    "data": "2026-06-24",
    "hora": "19:00"
  },
  "d1": {
    "data": "2026-06-12",
    "hora": "22:00"
  },
  "d2": {
    "data": "2026-06-14",
    "hora": "01:00"
  },
  "d3": {
    "data": "2026-06-20",
    "hora": "00:00"
  },
  "d4": {
    "data": "2026-06-19",
    "hora": "16:00"
  },
  "d5": {
    "data": "2026-06-25",
    "hora": "23:00"
  },
  "d6": {
    "data": "2026-06-25",
    "hora": "23:00"
  },
  "e1": {
    "data": "2026-06-14",
    "hora": "14:00"
  },
  "e2": {
    "data": "2026-06-14",
    "hora": "20:00"
  },
  "e3": {
    "data": "2026-06-20",
    "hora": "17:00"
  },
  "e4": {
    "data": "2026-06-20",
    "hora": "21:00"
  },
  "e5": {
    "data": "2026-06-25",
    "hora": "17:00"
  },
  "e6": {
    "data": "2026-06-25",
    "hora": "17:00"
  },
  "f1": {
    "data": "2026-06-14",
    "hora": "17:00"
  },
  "f2": {
    "data": "2026-06-14",
    "hora": "23:00"
  },
  "f3": {
    "data": "2026-06-21",
    "hora": "01:00"
  },
  "f4": {
    "data": "2026-06-20",
    "hora": "14:00"
  },
  "f5": {
    "data": "2026-06-25",
    "hora": "20:00"
  },
  "f6": {
    "data": "2026-06-25",
    "hora": "20:00"
  },
  "g1": {
    "data": "2026-06-15",
    "hora": "16:00"
  },
  "g2": {
    "data": "2026-06-15",
    "hora": "22:00"
  },
  "g3": {
    "data": "2026-06-21",
    "hora": "16:00"
  },
  "g4": {
    "data": "2026-06-21",
    "hora": "22:00"
  },
  "g5": {
    "data": "2026-06-27",
    "hora": "00:00"
  },
  "g6": {
    "data": "2026-06-27",
    "hora": "00:00"
  },
  "h1": {
    "data": "2026-06-15",
    "hora": "13:00"
  },
  "h2": {
    "data": "2026-06-15",
    "hora": "19:00"
  },
  "h3": {
    "data": "2026-06-21",
    "hora": "13:00"
  },
  "h4": {
    "data": "2026-06-21",
    "hora": "19:00"
  },
  "h5": {
    "data": "2026-06-26",
    "hora": "21:00"
  },
  "h6": {
    "data": "2026-06-26",
    "hora": "21:00"
  },
  "i1": {
    "data": "2026-06-16",
    "hora": "16:00"
  },
  "i2": {
    "data": "2026-06-16",
    "hora": "19:00"
  },
  "i3": {
    "data": "2026-06-22",
    "hora": "18:00"
  },
  "i4": {
    "data": "2026-06-22",
    "hora": "21:00"
  },
  "i5": {
    "data": "2026-06-26",
    "hora": "16:00"
  },
  "i6": {
    "data": "2026-06-26",
    "hora": "16:00"
  },
  "j1": {
    "data": "2026-06-16",
    "hora": "22:00"
  },
  "j2": {
    "data": "2026-06-17",
    "hora": "01:00"
  },
  "j3": {
    "data": "2026-06-22",
    "hora": "14:00"
  },
  "j4": {
    "data": "2026-06-23",
    "hora": "00:00"
  },
  "j5": {
    "data": "2026-06-27",
    "hora": "23:00"
  },
  "j6": {
    "data": "2026-06-27",
    "hora": "23:00"
  },
  "k1": {
    "data": "2026-06-17",
    "hora": "14:00"
  },
  "k2": {
    "data": "2026-06-17",
    "hora": "23:00"
  },
  "k3": {
    "data": "2026-06-23",
    "hora": "14:00"
  },
  "k4": {
    "data": "2026-06-23",
    "hora": "23:00"
  },
  "k5": {
    "data": "2026-06-27",
    "hora": "20:30"
  },
  "k6": {
    "data": "2026-06-27",
    "hora": "20:30"
  },
  "l1": {
    "data": "2026-06-17",
    "hora": "17:00"
  },
  "l2": {
    "data": "2026-06-17",
    "hora": "20:00"
  },
  "l3": {
    "data": "2026-06-23",
    "hora": "17:00"
  },
  "l4": {
    "data": "2026-06-23",
    "hora": "20:00"
  },
  "l5": {
    "data": "2026-06-27",
    "hora": "18:00"
  },
  "l6": {
    "data": "2026-06-27",
    "hora": "18:00"
  },
  "r32_1": {
    "data": "2026-06-28",
    "hora": "16:00"
  },
  "r32_2": {
    "data": "2026-06-29",
    "hora": "14:00"
  },
  "r32_3": {
    "data": "2026-06-29",
    "hora": "17:30"
  },
  "r32_4": {
    "data": "2026-06-29",
    "hora": "22:00"
  },
  "r32_5": {
    "data": "2026-06-30",
    "hora": "14:00"
  },
  "r32_6": {
    "data": "2026-06-30",
    "hora": "18:00"
  },
  "r32_7": {
    "data": "2026-06-30",
    "hora": "22:00"
  },
  "r32_8": {
    "data": "2026-07-01",
    "hora": "13:00"
  },
  "r32_9": {
    "data": "2026-07-01",
    "hora": "17:00"
  },
  "r32_10": {
    "data": "2026-07-01",
    "hora": "21:00"
  },
  "r32_11": {
    "data": "2026-07-02",
    "hora": "16:00"
  },
  "r32_12": {
    "data": "2026-07-02",
    "hora": "20:00"
  },
  "r32_13": {
    "data": "2026-07-03",
    "hora": "00:00"
  },
  "r32_14": {
    "data": "2026-07-03",
    "hora": "15:00"
  },
  "r32_15": {
    "data": "2026-07-03",
    "hora": "19:00"
  },
  "r32_16": {
    "data": "2026-07-03",
    "hora": "22:30"
  },
  "r16_1": {
    "data": "2026-07-04",
    "hora": "18:00"
  },
  "r16_2": {
    "data": "2026-07-04",
    "hora": "14:00"
  },
  "r16_3": {
    "data": "2026-07-05",
    "hora": "17:00"
  },
  "r16_4": {
    "data": "2026-07-05",
    "hora": "21:00"
  },
  "r16_5": {
    "data": "2026-07-06",
    "hora": "16:00"
  },
  "r16_6": {
    "data": "2026-07-06",
    "hora": "21:00"
  },
  "r16_7": {
    "data": "2026-07-07",
    "hora": "13:00"
  },
  "r16_8": {
    "data": "2026-07-07",
    "hora": "17:00"
  },
  "qf_1": {
    "data": "2026-07-09",
    "hora": "17:00"
  },
  "qf_2": {
    "data": "2026-07-10",
    "hora": "16:00"
  },
  "qf_3": {
    "data": "2026-07-11",
    "hora": "18:00"
  },
  "qf_4": {
    "data": "2026-07-11",
    "hora": "22:00"
  },
  "sf_1": {
    "data": "2026-07-14",
    "hora": "16:00"
  },
  "sf_2": {
    "data": "2026-07-15",
    "hora": "16:00"
  },
  "final_3rd": {
    "data": "2026-07-18",
    "hora": "18:00"
  },
  "final_1st": {
    "data": "2026-07-19",
    "hora": "16:00"
  }
};

const actual = {};
for (const grupo of Object.values(ctx.GRUPOS_COPA_2026)) {
  for (const jogo of grupo.jogos) actual[jogo.id] = { data: jogo.data, hora: jogo.hora, jogo: `${jogo.home} x ${jogo.away}` };
}
for (const fase of Object.values(ctx.KNOCKOUT_STAGES_2026)) {
  for (const jogo of fase.jogos) actual[jogo.id] = { data: jogo.data, hora: jogo.hora, jogo: `${jogo.home} x ${jogo.away}` };
}

const mismatches = [];
for (const [id, exp] of Object.entries(expected)) {
  const got = actual[id];
  if (!got) {
    mismatches.push(`${id}: ausente em data.js`);
    continue;
  }
  if (got.data !== exp.data || got.hora !== exp.hora) {
    mismatches.push(`${id} (${got.jogo}): data.js=${got.data} ${got.hora}, esperado BRT=${exp.data} ${exp.hora}`);
  }
}
const extra = Object.keys(actual).filter(id => !expected[id]);
for (const id of extra) mismatches.push(`${id}: jogo extra não previsto na referência`);

if (mismatches.length) {
  console.error(`❌ ${mismatches.length} divergência(s) de data/hora em data.js:`);
  for (const line of mismatches.slice(0, 120)) console.error(' - ' + line);
  if (mismatches.length > 120) console.error(` ... +${mismatches.length - 120} divergências`);
  process.exit(1);
}

console.log(`✅ ${Object.keys(expected).length} jogos conferidos: datas/horários em BRT batem com a referência.`);
