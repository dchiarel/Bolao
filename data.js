// ============================================================
// Copa do Mundo 2026 - Calendário Oficial
// Fonte: tabela pública da Copa do Mundo FIFA 2026 (convertida para BRT em 11/06/2026)
// Horários em BRT / America/Sao_Paulo (UTC-3)
// 48 seleções em 12 grupos (A-L)
// ============================================================

const GRUPOS_COPA_2026 = {
    A: { nome: 'Grupo A', times: ['México', 'África do Sul', 'Coreia do Sul', 'Tchéquia'],
        jogos: [
            { id: 'a1', home: 'México',        away: 'África do Sul',  data: '2026-06-11', hora: '16:00' },
            { id: 'a2', home: 'Coreia do Sul',  away: 'Tchéquia',       data: '2026-06-11', hora: '23:00' },
            { id: 'a3', home: 'Tchéquia',       away: 'África do Sul',  data: '2026-06-18', hora: '13:00' },
            { id: 'a4', home: 'México',         away: 'Coreia do Sul',  data: '2026-06-18', hora: '22:00' },
            { id: 'a5', home: 'Tchéquia',       away: 'México',         data: '2026-06-24', hora: '22:00' },
            { id: 'a6', home: 'África do Sul',  away: 'Coreia do Sul',  data: '2026-06-24', hora: '22:00' },
        ]
    },
    B: { nome: 'Grupo B', times: ['Canadá', 'Bósnia e Herzegovina', 'Catar', 'Suíça'],
        jogos: [
            { id: 'b1', home: 'Canadá',               away: 'Bósnia e Herzegovina', data: '2026-06-12', hora: '16:00' },
            { id: 'b2', home: 'Catar',                away: 'Suíça',                data: '2026-06-13', hora: '16:00' },
            { id: 'b3', home: 'Canadá',               away: 'Catar',                data: '2026-06-18', hora: '19:00' },
            { id: 'b4', home: 'Suíça',                away: 'Bósnia e Herzegovina', data: '2026-06-18', hora: '16:00' },
            { id: 'b5', home: 'Suíça',                away: 'Canadá',               data: '2026-06-24', hora: '16:00' },
            { id: 'b6', home: 'Bósnia e Herzegovina', away: 'Catar',                data: '2026-06-24', hora: '16:00' },
        ]
    },
    C: { nome: 'Grupo C', times: ['Brasil', 'Marrocos', 'Haiti', 'Escócia'],
        jogos: [
            { id: 'c1', home: 'Brasil',   away: 'Marrocos', data: '2026-06-13', hora: '19:00' },
            { id: 'c2', home: 'Haiti',    away: 'Escócia',  data: '2026-06-13', hora: '22:00' },
            { id: 'c3', home: 'Escócia',  away: 'Marrocos', data: '2026-06-19', hora: '19:00' },
            { id: 'c4', home: 'Brasil',   away: 'Haiti',    data: '2026-06-19', hora: '21:30' },
            { id: 'c5', home: 'Marrocos', away: 'Haiti',    data: '2026-06-24', hora: '19:00' },
            { id: 'c6', home: 'Escócia',  away: 'Brasil',   data: '2026-06-24', hora: '19:00' },
        ]
    },
    D: { nome: 'Grupo D', times: ['Estados Unidos', 'Paraguai', 'Austrália', 'Turquia'],
        jogos: [
            { id: 'd1', home: 'Estados Unidos', away: 'Paraguai',       data: '2026-06-12', hora: '22:00' },
            { id: 'd2', home: 'Austrália',      away: 'Turquia',        data: '2026-06-14', hora: '01:00' },
            { id: 'd3', home: 'Turquia',        away: 'Paraguai',       data: '2026-06-20', hora: '00:00' },
            { id: 'd4', home: 'Estados Unidos', away: 'Austrália',      data: '2026-06-19', hora: '16:00' },
            { id: 'd5', home: 'Turquia',        away: 'Estados Unidos', data: '2026-06-25', hora: '23:00' },
            { id: 'd6', home: 'Paraguai',       away: 'Austrália',      data: '2026-06-25', hora: '23:00' },
        ]
    },
    E: { nome: 'Grupo E', times: ['Alemanha', 'Curaçao', 'Costa do Marfim', 'Equador'],
        jogos: [
            { id: 'e1', home: 'Alemanha',        away: 'Curaçao',         data: '2026-06-14', hora: '14:00' },
            { id: 'e2', home: 'Costa do Marfim', away: 'Equador',         data: '2026-06-14', hora: '20:00' },
            { id: 'e3', home: 'Alemanha',        away: 'Costa do Marfim', data: '2026-06-20', hora: '17:00' },
            { id: 'e4', home: 'Equador',         away: 'Curaçao',         data: '2026-06-20', hora: '21:00' },
            { id: 'e5', home: 'Equador',         away: 'Alemanha',        data: '2026-06-25', hora: '17:00' },
            { id: 'e6', home: 'Curaçao',         away: 'Costa do Marfim', data: '2026-06-25', hora: '17:00' },
        ]
    },
    F: { nome: 'Grupo F', times: ['Países Baixos', 'Japão', 'Suécia', 'Tunísia'],
        jogos: [
            { id: 'f1', home: 'Países Baixos', away: 'Japão',         data: '2026-06-14', hora: '17:00' },
            { id: 'f2', home: 'Suécia',        away: 'Tunísia',       data: '2026-06-14', hora: '23:00' },
            { id: 'f3', home: 'Tunísia',       away: 'Japão',         data: '2026-06-21', hora: '01:00' },
            { id: 'f4', home: 'Países Baixos', away: 'Suécia',        data: '2026-06-20', hora: '14:00' },
            { id: 'f5', home: 'Tunísia',       away: 'Países Baixos', data: '2026-06-25', hora: '20:00' },
            { id: 'f6', home: 'Japão',         away: 'Suécia',        data: '2026-06-25', hora: '20:00' },
        ]
    },
    G: { nome: 'Grupo G', times: ['Bélgica', 'Egito', 'Irã', 'Nova Zelândia'],
        jogos: [
            { id: 'g1', home: 'Bélgica',       away: 'Egito',         data: '2026-06-15', hora: '16:00' },
            { id: 'g2', home: 'Irã',           away: 'Nova Zelândia', data: '2026-06-15', hora: '22:00' },
            { id: 'g3', home: 'Bélgica',       away: 'Irã',           data: '2026-06-21', hora: '16:00' },
            { id: 'g4', home: 'Nova Zelândia', away: 'Egito',         data: '2026-06-21', hora: '22:00' },
            { id: 'g5', home: 'Nova Zelândia', away: 'Bélgica',       data: '2026-06-27', hora: '00:00' },
            { id: 'g6', home: 'Egito',         away: 'Irã',           data: '2026-06-27', hora: '00:00' },
        ]
    },
    H: { nome: 'Grupo H', times: ['Espanha', 'Cabo Verde', 'Arábia Saudita', 'Uruguai'],
        jogos: [
            { id: 'h1', home: 'Espanha',         away: 'Cabo Verde',      data: '2026-06-15', hora: '13:00' },
            { id: 'h2', home: 'Arábia Saudita',  away: 'Uruguai',         data: '2026-06-15', hora: '19:00' },
            { id: 'h3', home: 'Espanha',         away: 'Arábia Saudita',  data: '2026-06-21', hora: '13:00' },
            { id: 'h4', home: 'Uruguai',         away: 'Cabo Verde',      data: '2026-06-21', hora: '19:00' },
            { id: 'h5', home: 'Uruguai',         away: 'Espanha',         data: '2026-06-26', hora: '21:00' },
            { id: 'h6', home: 'Cabo Verde',      away: 'Arábia Saudita',  data: '2026-06-26', hora: '21:00' },
        ]
    },
    I: { nome: 'Grupo I', times: ['França', 'Senegal', 'Iraque', 'Noruega'],
        jogos: [
            { id: 'i1', home: 'França',  away: 'Senegal', data: '2026-06-16', hora: '16:00' },
            { id: 'i2', home: 'Iraque',  away: 'Noruega', data: '2026-06-16', hora: '19:00' },
            { id: 'i3', home: 'França',  away: 'Iraque',  data: '2026-06-22', hora: '18:00' },
            { id: 'i4', home: 'Noruega', away: 'Senegal', data: '2026-06-22', hora: '21:00' },
            { id: 'i5', home: 'Noruega', away: 'França',  data: '2026-06-26', hora: '16:00' },
            { id: 'i6', home: 'Senegal', away: 'Iraque',  data: '2026-06-26', hora: '16:00' },
        ]
    },
    J: { nome: 'Grupo J', times: ['Argentina', 'Argélia', 'Áustria', 'Jordânia'],
        jogos: [
            { id: 'j1', home: 'Argentina', away: 'Argélia',   data: '2026-06-16', hora: '22:00' },
            { id: 'j2', home: 'Áustria',   away: 'Jordânia',  data: '2026-06-17', hora: '01:00' },
            { id: 'j3', home: 'Argentina', away: 'Áustria',   data: '2026-06-22', hora: '14:00' },
            { id: 'j4', home: 'Jordânia',  away: 'Argélia',   data: '2026-06-23', hora: '00:00' },
            { id: 'j5', home: 'Jordânia',  away: 'Argentina', data: '2026-06-27', hora: '23:00' },
            { id: 'j6', home: 'Argélia',   away: 'Áustria',   data: '2026-06-27', hora: '23:00' },
        ]
    },
    K: { nome: 'Grupo K', times: ['Portugal', 'RD Congo', 'Uzbequistão', 'Colômbia'],
        jogos: [
            { id: 'k1', home: 'Portugal',    away: 'RD Congo',    data: '2026-06-17', hora: '14:00' },
            { id: 'k2', home: 'Uzbequistão', away: 'Colômbia',    data: '2026-06-17', hora: '23:00' },
            { id: 'k3', home: 'Portugal',    away: 'Uzbequistão', data: '2026-06-23', hora: '14:00' },
            { id: 'k4', home: 'Colômbia',    away: 'RD Congo',    data: '2026-06-23', hora: '23:00' },
            { id: 'k5', home: 'Colômbia',    away: 'Portugal',    data: '2026-06-27', hora: '20:30' },
            { id: 'k6', home: 'RD Congo',    away: 'Uzbequistão', data: '2026-06-27', hora: '20:30' },
        ]
    },
    L: { nome: 'Grupo L', times: ['Inglaterra', 'Croácia', 'Gana', 'Panamá'],
        jogos: [
            { id: 'l1', home: 'Inglaterra', away: 'Croácia',    data: '2026-06-17', hora: '17:00' },
            { id: 'l2', home: 'Gana',       away: 'Panamá',     data: '2026-06-17', hora: '20:00' },
            { id: 'l3', home: 'Inglaterra', away: 'Gana',       data: '2026-06-23', hora: '17:00' },
            { id: 'l4', home: 'Panamá',     away: 'Croácia',    data: '2026-06-23', hora: '20:00' },
            { id: 'l5', home: 'Panamá',     away: 'Inglaterra', data: '2026-06-27', hora: '18:00' },
            { id: 'l6', home: 'Croácia',    away: 'Gana',       data: '2026-06-27', hora: '18:00' },
        ]
    }
};

// ============================================================
// FASES DE KNOCKOUT — horários serão atualizados conforme definidos
// ============================================================
const KNOCKOUT_STAGES_2026 = {
    '16avos': {
        nome: 'Round of 32 (16avos de Final)',
        multiplier: 1.5,
        jogos: [
            { id: 'r32_1',  home: 'TBD', away: 'TBD', data: '2026-06-28', hora: '16:00' },
            { id: 'r32_2',  home: 'TBD', away: 'TBD', data: '2026-06-29', hora: '14:00' },
            { id: 'r32_3',  home: 'TBD', away: 'TBD', data: '2026-06-29', hora: '17:30' },
            { id: 'r32_4',  home: 'TBD', away: 'TBD', data: '2026-06-29', hora: '22:00' },
            { id: 'r32_5',  home: 'TBD', away: 'TBD', data: '2026-06-30', hora: '14:00' },
            { id: 'r32_6',  home: 'TBD', away: 'TBD', data: '2026-06-30', hora: '18:00' },
            { id: 'r32_7',  home: 'TBD', away: 'TBD', data: '2026-06-30', hora: '22:00' },
            { id: 'r32_8',  home: 'TBD', away: 'TBD', data: '2026-07-01', hora: '13:00' },
            { id: 'r32_9',  home: 'TBD', away: 'TBD', data: '2026-07-01', hora: '17:00' },
            { id: 'r32_10', home: 'TBD', away: 'TBD', data: '2026-07-01', hora: '21:00' },
            { id: 'r32_11', home: 'TBD', away: 'TBD', data: '2026-07-02', hora: '16:00' },
            { id: 'r32_12', home: 'TBD', away: 'TBD', data: '2026-07-02', hora: '20:00' },
            { id: 'r32_13', home: 'TBD', away: 'TBD', data: '2026-07-03', hora: '00:00' },
            { id: 'r32_14', home: 'TBD', away: 'TBD', data: '2026-07-03', hora: '15:00' },
            { id: 'r32_15', home: 'TBD', away: 'TBD', data: '2026-07-03', hora: '19:00' },
            { id: 'r32_16', home: 'TBD', away: 'TBD', data: '2026-07-03', hora: '22:30' },
        ]
    },
    'oitavas': {
        nome: 'Round of 16 (Oitavas de Final)',
        multiplier: 2,
        jogos: [
            { id: 'r16_1', home: 'TBD', away: 'TBD', data: '2026-07-04', hora: '14:00' },
            { id: 'r16_2', home: 'TBD', away: 'TBD', data: '2026-07-04', hora: '18:00' },
            { id: 'r16_3', home: 'TBD', away: 'TBD', data: '2026-07-05', hora: '17:00' },
            { id: 'r16_4', home: 'TBD', away: 'TBD', data: '2026-07-05', hora: '21:00' },
            { id: 'r16_5', home: 'TBD', away: 'TBD', data: '2026-07-06', hora: '16:00' },
            { id: 'r16_6', home: 'TBD', away: 'TBD', data: '2026-07-06', hora: '21:00' },
            { id: 'r16_7', home: 'TBD', away: 'TBD', data: '2026-07-07', hora: '13:00' },
            { id: 'r16_8', home: 'TBD', away: 'TBD', data: '2026-07-07', hora: '17:00' },
        ]
    },
    'quartas': {
        nome: 'Quartas de Final',
        multiplier: 3,
        jogos: [
            { id: 'qf_1', home: 'TBD', away: 'TBD', data: '2026-07-09', hora: '17:00' },
            { id: 'qf_2', home: 'TBD', away: 'TBD', data: '2026-07-10', hora: '16:00' },
            { id: 'qf_3', home: 'TBD', away: 'TBD', data: '2026-07-11', hora: '18:00' },
            { id: 'qf_4', home: 'TBD', away: 'TBD', data: '2026-07-11', hora: '22:00' },
        ]
    },
    'semis': {
        nome: 'Semifinais',
        multiplier: 4,
        jogos: [
            { id: 'sf_1', home: 'TBD', away: 'TBD', data: '2026-07-14', hora: '16:00' },
            { id: 'sf_2', home: 'TBD', away: 'TBD', data: '2026-07-15', hora: '16:00' },
        ]
    },
    'final': {
        nome: 'Final & 3º Lugar',
        multiplier: 5,
        jogos: [
            { id: 'final_3rd', home: 'TBD', away: 'TBD', data: '2026-07-18', hora: '18:00', desc: '3º Lugar' },
            { id: 'final_1st', home: 'TBD', away: 'TBD', data: '2026-07-19', hora: '16:00', desc: 'Grande Final' },
        ]
    }
};

// ============================================================
// MULTIPLIERS POR FASE
// ============================================================
const GAME_MULTIPLIERS = {
    'grupos':  1,
    '16avos':  1.5,
    'oitavas': 2,
    'quartas': 3,
    'semis':   4,
    'final':   5
};
