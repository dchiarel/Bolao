// ====================
// SISTEMA DE BLOQUEIO DE PALPITES
// ====================

// Prazo para previsões gerais: 30 min antes do jogo de abertura (11/06 16h BRT)
const DEADLINE_PREVISOES = new Date('2026-06-11T15:30:00-03:00');
// Bloqueio de cada jogo: 30 minutos antes do início
const MINUTOS_BLOQUEIO = 30;

function getGameDateTime(gameId) {
    // Procurar em grupos
    for (const grupo of Object.values(GRUPOS_COPA_2026)) {
        const jogo = grupo.jogos.find(j => j.id === gameId);
        if (jogo && jogo.hora) {
            return new Date(`${jogo.data}T${jogo.hora}:00-03:00`);
        }
    }
    // Procurar em knockouts
    for (const stage of Object.values(KNOCKOUT_STAGES_2026)) {
        const jogo = stage.jogos.find(j => j.id === gameId);
        if (jogo && jogo.hora) {
            return new Date(`${jogo.data}T${jogo.hora}:00-03:00`);
        }
    }
    return null;
}

function findGame(gameId) {
    for (const grupo of Object.values(GRUPOS_COPA_2026)) {
        const jogo = grupo.jogos.find(j => j.id === gameId);
        if (jogo) return jogo;
    }
    for (const stage of Object.values(KNOCKOUT_STAGES_2026)) {
        const jogo = stage.jogos.find(j => j.id === gameId);
        if (jogo) return jogo;
    }
    return null;
}

function isGameLocked(gameId) {
    const gameTime = getGameDateTime(gameId);
    if (!gameTime) return false;
    const lockTime = new Date(gameTime.getTime() - MINUTOS_BLOQUEIO * 60 * 1000);
    return new Date() >= lockTime;
}

function isOverallLocked() {
    return new Date() >= DEADLINE_PREVISOES;
}

function tempoAteBloquear(gameId) {
    const gameTime = getGameDateTime(gameId);
    if (!gameTime) return null;
    const lockTime = new Date(gameTime.getTime() - MINUTOS_BLOQUEIO * 60 * 1000);
    const diff = lockTime - new Date();
    if (diff <= 0) return null;
    const dias  = Math.floor(diff / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const min   = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (dias > 1) return `${dias}d ${horas}h`;
    if (dias === 1) return `1d ${horas}h`;
    if (horas > 0)  return `${horas}h ${min}min`;
    return `${min}min`;
}

function badgeBloqueio(gameId) {
    if (isGameLocked(gameId)) {
        return `<span class="lock-badge">🔒 Encerrado</span>`;
    }
    const tempo = tempoAteBloquear(gameId);
    // Alerta se faltar menos de 2 horas
    if (tempo && !tempo.includes('d') && (tempo.includes('min') || (tempo.includes('h') && parseInt(tempo) <= 2))) {
        return `<span class="warn-badge">⏳ ${tempo}</span>`;
    }
    return '';
}

// ====================
// AUTENTICAÇÃO / PIN SYSTEM
// ====================

const ADMIN_PIN = '0000'; // ← PIN do administrador (mude antes de publicar!)

// ====================
// SINCRONIZAÇÃO NA NUVEM (Firebase Realtime Database)
// Crie um projeto grátis em https://console.firebase.google.com,
// ative o Realtime Database (modo teste) e cole a URL aqui (sem barra no final).
// Ex.: 'https://bolao-dos-guri-default-rtdb.firebaseio.com'
// Se ficar vazio, o app funciona só neste navegador (modo local).
// ====================
const SYNC_URL = 'https://bolao-dus-guri-default-rtdb.firebaseio.com';

function syncOn() { return !!SYNC_URL; }

async function fetchRemoteState() {
    if (!syncOn()) return;
    try {
        const res = await fetch(`${SYNC_URL}/bolao.json?t=` + Date.now());
        if (!res.ok) return;
        const remote = await res.json();
        if (!remote) return;

        // Tombstones: cadastros removidos pelo admin. Nenhum aparelho deve ressuscitá-los.
        knownDeleted = remote.deleted || {};
        const isDeleted = id => Object.prototype.hasOwnProperty.call(knownDeleted, String(id));

        // participants: a NUVEM é a fonte da verdade. Isso remove "fantasmas"
        // (cadastros antigos que só existiam no localStorage e nunca foram pra nuvem).
        const remoteParts = remote.participants ? Object.values(remote.participants) : [];
        if (remoteParts.length) {
            const byId = {};
            remoteParts.forEach(p => { if (!isDeleted(p.id)) byId[p.id] = p; });
            // Nunca perde o próprio cadastro (caso ainda não tenha subido pra nuvem),
            // a menos que o admin tenha removido este cadastro.
            const sessionId = parseInt(localStorage.getItem('bolao_session_pid'));
            const mineLocal = state.participants.find(p => p.id === sessionId);
            if (mineLocal && !isDeleted(mineLocal.id)) byId[mineLocal.id] = mineLocal;
            state.participants = Object.values(byId);
        } else if (Object.keys(knownDeleted).length) {
            // Nuvem sem participantes, mas com tombstones: remove os fantasmas locais.
            state.participants = state.participants.filter(p => !isDeleted(p.id));
        }

        // Se o usuário logado foi removido pelo admin, encerra a sessão neste aparelho.
        if (currentParticipantId && isDeleted(currentParticipantId)) {
            currentParticipantId = null;
            localStorage.removeItem('bolao_session_pid');
        }

        // Palpites: a nuvem é a fonte para os OUTROS participantes;
        // os dados do usuário logado neste aparelho permanecem locais (ele é o dono).
        ['gamesPredictions', 'overallPredictions', 'goldenTipps'].forEach(k => {
            const rem = remote[k] || {};
            Object.entries(rem).forEach(([pid, data]) => {
                if (String(pid) !== String(currentParticipantId)) {
                    state[k][pid] = data;
                }
            });
        });

        saveState();
    } catch (e) {
        console.log('sync: sem conexão com a nuvem —', e.message);
    }
}

async function pushParticipant(p) {
    if (!syncOn()) return;
    if (knownDeleted[String(p.id)]) return; // não ressuscita cadastro removido pelo admin
    try {
        await fetch(`${SYNC_URL}/bolao/participants/${p.id}.json`, {
            method: 'PUT',
            body: JSON.stringify(p)
        });
    } catch (e) {}
}

async function deleteParticipantRemote(id) {
    if (!syncOn()) return;
    // "Tombstone": marca o cadastro como removido para sempre. Sem isso, um aparelho
    // antigo (com o cadastro ainda no localStorage) reenviaria o fantasma pra nuvem.
    try { await fetch(`${SYNC_URL}/bolao/deleted/${id}.json`, { method: 'PUT', body: JSON.stringify(Date.now()) }); } catch (e) {}
    knownDeleted[String(id)] = Date.now();
    const paths = [`participants/${id}`, `gamesPredictions/${id}`, `overallPredictions/${id}`, `goldenTipps/${id}`];
    for (const path of paths) {
        try { await fetch(`${SYNC_URL}/bolao/${path}.json`, { method: 'DELETE' }); } catch (e) {}
    }
}

let _pushTimer = null;
function schedulePush() {
    if (!syncOn() || !currentParticipantId) return;
    clearTimeout(_pushTimer);
    _pushTimer = setTimeout(pushMyData, 1200);
}

async function pushMyData() {
    if (!syncOn() || !currentParticipantId) return;
    const pid = currentParticipantId;
    if (knownDeleted[String(pid)]) return; // cadastro removido pelo admin: não reenvia
    const me  = getCurrentParticipant();
    const payloads = {
        // Regrava SEMPRE o próprio cadastro junto (evita "fantasmas" sem nome na nuvem)
        ...(me ? { [`participants/${pid}`]: me } : {}),
        [`gamesPredictions/${pid}`]:   state.gamesPredictions[pid]   || {},
        [`overallPredictions/${pid}`]: state.overallPredictions[pid] || {},
        [`goldenTipps/${pid}`]:        state.goldenTipps[pid]        || []
    };
    for (const [path, body] of Object.entries(payloads)) {
        try {
            await fetch(`${SYNC_URL}/bolao/${path}.json`, { method: 'PUT', body: JSON.stringify(body) });
        } catch (e) {}
    }
}

// Garante que o cadastro do usuário logado esteja na nuvem (autorreparo)
async function selfHealParticipant() {
    if (!syncOn()) return;
    const me = getCurrentParticipant();
    if (me && !knownDeleted[String(me.id)]) await pushParticipant(me);
}

let currentParticipantId = null;
// Cadastros removidos pelo admin (tombstones vindos da nuvem). Bloqueia o reenvio.
let knownDeleted = {};

function restoreSession() {
    const saved = localStorage.getItem('bolao_session_pid');
    if (saved) {
        const id = parseInt(saved);
        if (state.participants.find(p => p.id === id)) {
            currentParticipantId = id;
        }
    }
}

function isLoggedIn() { return currentParticipantId !== null; }

function getCurrentParticipant() {
    return state.participants.find(p => p.id === currentParticipantId) || null;
}

function showLoginError(msg) {
    const el = document.getElementById('loginError');
    el.textContent = msg;
    el.style.display = 'block';
}

function doLogin() {
    const sel  = document.getElementById('loginName');
    const pin  = document.getElementById('loginPin').value.trim();
    if (!sel.value) return showLoginError('Selecione seu nome na lista.');
    const id   = parseInt(sel.value);
    const p    = state.participants.find(p => p.id === id);
    if (!p || p.pin !== pin) return showLoginError('PIN incorreto. Tente novamente.');
    currentParticipantId = p.id;
    localStorage.setItem('bolao_session_pid', p.id);
    closeLoginModal();
    renderParticipants();
    showToast(`Bem-vindo, ${p.name}! 🎉`);
}

function logout() {
    currentParticipantId = null;
    localStorage.removeItem('bolao_session_pid');
    renderParticipants();
    switchTab('home');
    showToast('Saiu da conta.');
}

function openLoginModal() {
    // Resetar para aba "Entrar"
    showAuthTab('login');
    const sel = document.getElementById('loginName');
    sel.innerHTML = '<option value="">Selecione seu nome</option>' +
        state.participants.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    document.getElementById('loginPin').value = '';
    document.getElementById('loginError').style.display = 'none';
    document.getElementById('registerError').style.display = 'none';
    document.getElementById('registerName').value = '';
    document.getElementById('registerPin').value = '';
    document.getElementById('registerPin2').value = '';
    document.getElementById('loginModal').style.display = 'flex';
    setTimeout(() => document.getElementById('loginPin').focus(), 100);
}

function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
}

// Abre o modal escolhendo a aba certa:
// - sem participantes ainda → vai direto pro cadastro
// - já existem participantes → mostra "Entrar" (mas o usuário pode trocar p/ cadastro)
function openAuthSmart() {
    openLoginModal();
    const semGente = state.participants.length === 0;
    showAuthTab(semGente ? 'register' : 'login');
    setTimeout(() => {
        const alvo = semGente
            ? document.getElementById('registerName')
            : document.getElementById('loginPin');
        if (alvo) alvo.focus();
    }, 120);
}

function showAuthTab(tab) {
    document.getElementById('authTabLogin').style.display    = tab === 'login'    ? 'block' : 'none';
    document.getElementById('authTabRegister').style.display = tab === 'register' ? 'block' : 'none';

    const btnLogin = document.getElementById('tabBtnLogin');
    const btnReg   = document.getElementById('tabBtnRegister');
    btnLogin.classList.toggle('active', tab === 'login');
    btnReg.classList.toggle('active', tab === 'register');

    // Os botões usam estilo inline → atualizar o destaque manualmente
    const ativo   = ['#FFD700', '#1a1a2e'];   // [fundo, texto]
    const inativo = ['transparent', '#9aa4ba'];
    const [lb, lc] = tab === 'login'    ? ativo : inativo;
    const [rb, rc] = tab === 'register' ? ativo : inativo;
    btnLogin.style.background = lb; btnLogin.style.color = lc;
    btnReg.style.background   = rb; btnReg.style.color   = rc;
}

function doRegister() {
    const name = document.getElementById('registerName').value.trim();
    const pin  = document.getElementById('registerPin').value.trim();
    const pin2 = document.getElementById('registerPin2').value.trim();

    if (!name)                return showRegisterError('Digite seu nome.');
    if (!/^\d{4}$/.test(pin)) return showRegisterError('PIN deve ter exatamente 4 dígitos.');
    if (pin !== pin2)         return showRegisterError('Os PINs não coincidem.');
    if (state.participants.find(p => p.name.toLowerCase() === name.toLowerCase()))
                              return showRegisterError('Esse nome já está cadastrado. Escolha outro ou entre com seu PIN.');

    const id = Date.now();
    const novo = { id, name, pin, joinedDate: new Date().toISOString() };
    state.participants.push(novo);
    currentParticipantId = id;
    localStorage.setItem('bolao_session_pid', id);
    saveState();
    pushParticipant(novo);
    closeLoginModal();
    renderParticipants();
    showToast(`Bem-vindo ao bolão, ${name}! 🎉`);
}

function showRegisterError(msg) {
    const el = document.getElementById('registerError');
    el.textContent = msg;
    el.style.display = 'block';
}

function openAdminModal() {
    const pin = prompt('PIN do administrador:');
    if (pin !== ADMIN_PIN) { alert('PIN incorreto!'); return; }
    renderAdminList();
    document.getElementById('adminModal').style.display = 'flex';
}

function closeAdminModal() {
    document.getElementById('adminModal').style.display = 'none';
}

function doAddParticipant() {
    const name = document.getElementById('adminName').value.trim();
    const pin  = document.getElementById('adminPinNew').value.trim();
    if (!name) return alert('Digite o nome!');
    if (!/^\d{4}$/.test(pin)) return alert('PIN deve ter exatamente 4 dígitos!');
    if (state.participants.find(p => p.name.toLowerCase() === name.toLowerCase()))
        return alert('Participante já existe!');

    const id = Date.now();
    const novo = { id, name, pin, joinedDate: new Date().toISOString() };
    state.participants.push(novo);
    document.getElementById('adminName').value = '';
    document.getElementById('adminPinNew').value = '';
    saveState();
    pushParticipant(novo);
    renderAdminList();
    renderParticipants();
    showToast(`${name} adicionado! PIN: ${pin}`);
}

function doRemoveParticipant(id) {
    const p = state.participants.find(p => p.id === id);
    if (!confirm(`Remover ${p?.name}?`)) return;
    state.participants = state.participants.filter(p => p.id !== id);
    if (currentParticipantId === id) logout();
    saveState();
    deleteParticipantRemote(id);
    renderAdminList();
    renderParticipants();
}

// Ação MANUAL do admin: puxa a lista oficial da nuvem e remove fantasmas locais.
// Cadastros já marcados como removidos (tombstones) não voltam.
async function limparFantasmas() {
    if (!syncOn()) { alert('Sincronização com a nuvem está desativada.'); return; }
    if (!confirm('Buscar a lista oficial na nuvem e remover cadastros fantasmas?')) return;
    const antes = state.participants.length;
    showToast('Sincronizando com a nuvem…');
    await fetchRemoteState();
    saveState();
    renderAdminList();
    renderParticipants();
    const removidos = antes - state.participants.length;
    showToast(removidos > 0
        ? `Lista sincronizada. ${removidos} fantasma(s) removido(s). ✅`
        : 'Lista sincronizada com a nuvem. ✅');
}

function renderAdminList() {
    const el = document.getElementById('adminParticipantsList');
    if (!el) return;
    if (state.participants.length === 0) {
        el.innerHTML = '<p style="color:#999;text-align:center">Nenhum participante ainda.</p>';
        return;
    }
    el.innerHTML = state.participants.map(p => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:8px;margin-bottom:8px;">
            <div>
                <strong style="color:white;">${p.name}</strong>
                <span style="color:#9aa4ba;font-size:0.85em;margin-left:10px;">PIN: ${p.pin}</span>
            </div>
            <button onclick="doRemoveParticipant(${p.id})"
                style="background:#e63946;color:white;border:none;border-radius:6px;padding:4px 12px;cursor:pointer;font-size:0.85em;">
                Remover
            </button>
        </div>`).join('');
}

function showToast(msg) {
    let t = document.getElementById('toast');
    if (!t) {
        t = document.createElement('div');
        t.id = 'toast';
        t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1a1a2e;color:white;padding:12px 24px;border-radius:30px;font-weight:600;z-index:9999;transition:opacity .4s;font-size:0.95em;box-shadow:0 4px 20px rgba(0,0,0,.3)';
        document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = '1';
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.style.opacity = '0', 3000);
}

// ====================
// STATE MANAGEMENT (v6 - dados oficiais + CSV + resultados remotos)
// ====================

const STATE_KEY = 'bolao_state_v7';

let state = {
    participants: [],
    gamesPredictions: {},
    overallPredictions: {},
    goldenTipps: {},
    gameResults: {},
    overallResults: {},
};

function loadState() {
    // Limpar versões antigas de teste (grupos/datas mudaram)
    localStorage.removeItem('bolao_state_v5');
    localStorage.removeItem('bolao_state_v6');
    const saved = localStorage.getItem(STATE_KEY);
    if (saved) {
        try {
            state = { ...state, ...JSON.parse(saved) };
            // Participantes sem PIN não conseguem logar — descartar registros inválidos
            state.participants = (state.participants || []).filter(p => p && p.pin);
        } catch (e) {
            initState();
        }
    } else {
        initState();
    }
}

function initState() {
    state = {
        participants: [],
        gamesPredictions: {},
        overallPredictions: {},
        goldenTipps: {},
        gameResults: {},
        overallResults: {},
    };
    saveState();
}

function saveState() {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

// ====================
// UI HELPERS (redesign) — cor única por participante, ranking, etc.
// ====================
function hashStr(str){
    let h = 0;
    for (let i = 0; i < String(str).length; i++) { h = (h << 5) - h + String(str).charCodeAt(i); h |= 0; }
    return Math.abs(h);
}
function colorFor(seed){
    const hue = hashStr(seed) % 360;
    return {
        a: `hsl(${hue} 78% 60%)`,
        b: `hsl(${(hue + 28) % 360} 70% 42%)`
    };
}
function initialOf(name){ return (name || '?').trim().charAt(0).toUpperCase() || '?'; }

// mapa id -> posição (1-based) por pontuação
function getRankMap(){
    const sorted = [...state.participants].sort((a, b) => getTotalScore(b.id) - getTotalScore(a.id));
    const map = {};
    sorted.forEach((p, i) => map[p.id] = i + 1);
    return map;
}
function medalFor(pos){ return pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : ''; }

// bandeiras (emoji) das 48 seleções
const FLAGS = {
    'Coreia do Sul':'🇰🇷','México':'🇲🇽','Tchéquia':'🇨🇿','África do Sul':'🇿🇦',
    'Bósnia e Herzegovina':'🇧🇦','Canadá':'🇨🇦','Catar':'🇶🇦','Suíça':'🇨🇭',
    'Brasil':'🇧🇷','Escócia':'🏴󠁧󠁢󠁳󠁣󠁴󠁿','Haiti':'🇭🇹','Marrocos':'🇲🇦',
    'Austrália':'🇦🇺','Estados Unidos':'🇺🇸','Paraguai':'🇵🇾','Turquia':'🇹🇷',
    'Alemanha':'🇩🇪','Costa do Marfim':'🇨🇮','Curaçao':'🇨🇼','Equador':'🇪🇨',
    'Países Baixos':'🇳🇱','Japão':'🇯🇵','Suécia':'🇸🇪','Tunísia':'🇹🇳',
    'Bélgica':'🇧🇪','Egito':'🇪🇬','Irã':'🇮🇷','Nova Zelândia':'🇳🇿',
    'Arábia Saudita':'🇸🇦','Cabo Verde':'🇨🇻','Espanha':'🇪🇸','Uruguai':'🇺🇾',
    'França':'🇫🇷','Iraque':'🇮🇶','Noruega':'🇳🇴','Senegal':'🇸🇳',
    'Argentina':'🇦🇷','Argélia':'🇩🇿','Áustria':'🇦🇹','Jordânia':'🇯🇴',
    'Colômbia':'🇨🇴','Portugal':'🇵🇹','RD Congo':'🇨🇩','Uzbequistão':'🇺🇿',
    'Croácia':'🇭🇷','Gana':'🇬🇭','Inglaterra':'🏴󠁧󠁢󠁥󠁮󠁧󠁿','Panamá':'🇵🇦'
};
function flagFor(name){ return FLAGS[name] || '🏳️'; }
function fmtData(d){ if(!d) return ''; const p = d.split('-'); return p.length===3 ? `${p[2]}/${p[1]}` : d; }
function splitPlacar(str){ const p = (str || '').split('-'); return { h: p[0] || '', a: p[1] || '' }; }

// salva placar a partir de dois campos numéricos (mantém formato "h-a")
function setPlacar(pid, gameId, side, value){
    const cur = getGamePrediction(pid, gameId, 'winner') || '';
    let { h, a } = splitPlacar(cur);
    value = (value === '' ? '' : String(Math.max(0, parseInt(value) || 0)));
    if (side === 'h') h = value; else a = value;
    const combined = (h === '' && a === '') ? '' : `${h}-${a}`;
    setGamePrediction(pid, gameId, 'winner', combined);
    const row = document.getElementById('row-' + pid + '-' + gameId);
    if (row) row.classList.toggle('done', h !== '' && a !== '');
    const dt = document.getElementById('dt-' + pid + '-' + gameId);
    if (dt) dt.classList.toggle('ok', h !== '' && a !== '');
}

// Golden Tipp: marca/desmarca um jogo (máx. 3 por participante)
function toggleGolden(pid, gameId, phaseName){
    if (isGameLocked(gameId)) { showToast('🔒 Este jogo já está bloqueado.'); return; }
    if (!state.goldenTipps[pid]) state.goldenTipps[pid] = [];
    const arr = state.goldenTipps[pid];
    const idx = arr.findIndex(g => g.gameId === gameId);
    if (idx >= 0) {
        arr.splice(idx, 1);
    } else {
        if (arr.length >= 3) { alert('Máximo de 3 Golden Tipps por participante! Remova um antes.'); return; }
        arr.push({ gameId, prediction: '', used: false });
    }
    saveState();
    schedulePush();
    renderKnockoutPhase(phaseName);
}
function isGolden(pid, gameId){
    return (state.goldenTipps[pid] || []).some(g => g.gameId === gameId);
}

// ====================
// RESULTADOS REMOTOS (GitHub Actions → resultados_2026.json)
// ====================

async function carregarResultadosRemotos() {
    try {
        const res = await fetch('resultados_2026.json?t=' + Date.now());
        if (!res.ok) return;
        const dados = await res.json();

        // Mesclar resultados de jogos
        if (dados.gameResults) {
            Object.assign(state.gameResults, dados.gameResults);
        }
        // Mesclar resultados gerais
        if (dados.overallResults && Object.keys(dados.overallResults).length > 0) {
            state.overallResults = { ...state.overallResults, ...dados.overallResults };
        }
        // Atualizar labels dos jogos de knockout com times reais
        if (dados.knockoutTeams) {
            atualizarTimesKnockout(dados.knockoutTeams);
        }

        saveState();
        console.log('✅ Resultados remotos carregados:', new Date(dados.updatedAt || Date.now()).toLocaleString('pt-BR'));
    } catch(e) {
        console.log('ℹ️ resultados_2026.json não disponível ainda (normal no início da Copa)');
    }
}

function atualizarTimesKnockout(knockoutTeams) {
    // knockoutTeams = { 'r32_1': { home: 'Brasil', away: 'Argentina' }, ... }
    Object.entries(knockoutTeams).forEach(([gameId, teams]) => {
        for (const stage of Object.values(KNOCKOUT_STAGES_2026)) {
            const jogo = stage.jogos.find(j => j.id === gameId);
            if (jogo) {
                jogo.home = teams.home || jogo.home;
                jogo.away = teams.away || jogo.away;
            }
        }
    });
}

// ====================
// PARTICIPANTS
// ====================

// addParticipant e removeParticipant agora são gerenciados pelo admin modal
function addParticipant() { openAdminModal(); }
function removeParticipant(id) { doRemoveParticipant(id); }

// ====================
// GAME PREDICTIONS
// ====================

function setGamePrediction(participantId, gameId, field, value) {
    if (isGameLocked(gameId)) { showToast('🔒 Palpites encerrados para este jogo.'); return; }
    if (!state.gamesPredictions[participantId]) {
        state.gamesPredictions[participantId] = {};
    }
    if (!state.gamesPredictions[participantId][gameId]) {
        state.gamesPredictions[participantId][gameId] = {};
    }
    state.gamesPredictions[participantId][gameId][field] = value;
    saveState();
    schedulePush();
}

function getGamePrediction(participantId, gameId, field) {
    return state.gamesPredictions[participantId]?.[gameId]?.[field] || '';
}

// ====================
// OVERALL PREDICTIONS
// ====================

function setOverallPrediction(participantId, field, value) {
    if (isOverallLocked()) { showToast('🔒 Prazo das previsões gerais encerrado.'); return; }
    if (!state.overallPredictions[participantId]) {
        state.overallPredictions[participantId] = {};
    }
    state.overallPredictions[participantId][field] = value;
    saveState();
    schedulePush();
}

function getOverallPrediction(participantId, field) {
    return state.overallPredictions[participantId]?.[field] || '';
}

// ====================
// GOLDEN TIPPS
// ====================

function setGoldenTipp(participantId, gameId, prediction) {
    if (!state.goldenTipps[participantId]) {
        state.goldenTipps[participantId] = [];
    }
    const existing = state.goldenTipps[participantId].find(gt => gt.gameId === gameId);
    if (existing) {
        existing.prediction = prediction;
    } else {
        state.goldenTipps[participantId].push({ gameId, prediction, used: false });
    }
    saveState();
}

function getGoldenTipps(participantId) {
    return state.goldenTipps[participantId] || [];
}

// ====================
// RESULTS
// ====================

function setGameResult(gameId, homeGoals, awayGoals, advancedTeam) {
    state.gameResults[gameId] = { homeGoals, awayGoals, advancedTeam };
    saveState();
}

function getGameResult(gameId) {
    return state.gameResults[gameId];
}

function setOverallResults(topScorer, finalist1, finalist2, winner) {
    state.overallResults = { topScorer, finalist1, finalist2, winner };
    saveState();
}

// ====================
// SCORING FUNCTIONS
// ====================

function getMultiplierForGame(gameId) {
    for (const [phase, data] of Object.entries(KNOCKOUT_STAGES_2026)) {
        if (data.jogos.some(j => j.id === gameId)) {
            return GAME_MULTIPLIERS[phase];
        }
    }
    return GAME_MULTIPLIERS['grupos'];
}

function calculateScoreGame(participantId, gameId) {
    const prediction = state.gamesPredictions[participantId]?.[gameId];
    const result = state.gameResults[gameId];

    if (!prediction || !result) return 0;

    let points = 0;
    const homeGoals = result.homeGoals;
    const awayGoals = result.awayGoals;

    // Palpite só vale se estiver completo no formato "X-Y"
    const m = /^(\d+)-(\d+)$/.exec(prediction.winner || '');
    if (m) {
        const predHome = parseInt(m[1]);
        const predAway = parseInt(m[2]);

        // Check perfect score
        if (homeGoals === predHome && awayGoals === predAway) {
            points = 10;
        } else {
            // Check goal difference
            const actualGD = homeGoals - awayGoals;
            const predGD = predHome - predAway;

            if ((homeGoals > awayGoals && predHome > predAway) ||
                (homeGoals < awayGoals && predHome < predAway) ||
                (homeGoals === awayGoals && predHome === predAway)) {
                if (actualGD === predGD) {
                    points = 6; // Correct winner + GD
                } else {
                    points = 4; // Just correct winner
                }
            }
        }
    }

    // Add advance team bonus (only for knockout)
    if (prediction.advanceTeam === result.advancedTeam && result.advancedTeam) {
        points += 2;
    }

    // Apply multiplier
    const multiplier = getMultiplierForGame(gameId);
    return Math.round(points * multiplier);
}

function calculateScoreOverall(participantId) {
    let points = 0;
    const overall = state.overallPredictions[participantId];
    const results = state.overallResults;

    if (!overall || !results) return 0;

    if (overall.topScorer?.toLowerCase() === results.topScorer?.toLowerCase()) points += 50;
    if (overall.finalist1?.toLowerCase() === results.finalist1?.toLowerCase()) points += 25;
    if (overall.finalist1?.toLowerCase() === results.finalist2?.toLowerCase()) points += 25;
    if (overall.finalist2?.toLowerCase() === results.finalist1?.toLowerCase()) points += 25;
    if (overall.finalist2?.toLowerCase() === results.finalist2?.toLowerCase()) points += 25;
    if (overall.winner?.toLowerCase() === results.winner?.toLowerCase()) points += 25;

    return points;
}

function calculateScoreGoldenTipps(participantId) {
    let points = 0;
    const tipps = state.goldenTipps[participantId] || [];

    tipps.forEach(tipp => {
        const result = state.gameResults[tipp.gameId];
        if (!result) return;

        const prediction = state.gamesPredictions[participantId]?.[tipp.gameId];
        if (!prediction) return;

        // Palpite só vale se completo no formato "X-Y"
        const m = /^(\d+)-(\d+)$/.exec(prediction.winner || '');
        if (!m) return;

        // Only award points if perfect score
        if (result.homeGoals === parseInt(m[1]) && result.awayGoals === parseInt(m[2])) {
            const basePoints = 10 * getMultiplierForGame(tipp.gameId);
            points += basePoints * 3; // Triple the score
        }
    });

    return points;
}

function getTotalScore(participantId) {
    let total = 0;

    // Group stage games
    Object.values(GRUPOS_COPA_2026).forEach(grupo => {
        grupo.jogos.forEach(jogo => {
            total += calculateScoreGame(participantId, jogo.id);
        });
    });

    // Knockout games
    Object.values(KNOCKOUT_STAGES_2026).forEach(stage => {
        stage.jogos.forEach(jogo => {
            total += calculateScoreGame(participantId, jogo.id);
        });
    });

    // Overall predictions
    total += calculateScoreOverall(participantId);

    // Golden Tipps
    total += calculateScoreGoldenTipps(participantId);

    return total;
}

function getScoreBreakdown(participantId) {
    let grupos = 0, knockouts = 0, overall = 0, goldenTipps = 0;

    // Group stage
    Object.values(GRUPOS_COPA_2026).forEach(grupo => {
        grupo.jogos.forEach(jogo => {
            grupos += calculateScoreGame(participantId, jogo.id);
        });
    });

    // Knockouts
    Object.values(KNOCKOUT_STAGES_2026).forEach(stage => {
        stage.jogos.forEach(jogo => {
            knockouts += calculateScoreGame(participantId, jogo.id);
        });
    });

    // Overall
    overall = calculateScoreOverall(participantId);

    // Golden Tipps
    goldenTipps = calculateScoreGoldenTipps(participantId);

    return { grupos, knockouts, overall, goldenTipps };
}

// ====================
// RENDERING
// ====================

function renderParticipants() {
    const container = document.getElementById('participantsList');
    if (!container) return;

    if (state.participants.length === 0) {
        container.innerHTML = `<div class="empty-hint">Nenhum guri no bolão ainda. Adicione o primeiro nome acima ⚽</div>`;
        renderMiniRanking();
        return;
    }

    const ranks = getRankMap();
    const cur   = currentParticipantId;

    container.innerHTML = state.participants.map(p => {
        const c      = colorFor(p.id + p.name);
        const pos    = ranks[p.id];
        const medal  = medalFor(pos);
        const badge  = medal
            ? `<span class="rank-badge gold">${medal} ${pos}º</span>`
            : `<span class="rank-badge">#${pos}</span>`;
        const isMe   = cur === p.id;
        const myRing = isMe ? 'style="outline:3px solid #FFD700;outline-offset:3px"' : '';

        // Botão: se é o participante logado → Sair | se não → Entrar
        const btn = isMe
            ? `<button class="btn-entrar sair" onclick="logout()">Sair</button>`
            : `<button class="btn-entrar" onclick="openLoginModal()">Entrar</button>`;

        return `
        <div class="participant-card ${isMe ? 'mine' : ''}" style="--pa:${c.a};--pb:${c.b}">
            <div class="pc-head">
                <div class="avatar" ${myRing}>${initialOf(p.name)}</div>
                ${badge}
            </div>
            <h3>${p.name}</h3>
            <div class="score">${getTotalScore(p.id)}</div>
            <p>pontos</p>
            ${btn}
        </div>`;
    }).join('');

    renderMiniRanking();
}

// mini-ranking (widget lateral persistente)
function renderMiniRanking() {
    const el = document.getElementById('miniRankingList');
    if (!el) return;
    if (state.participants.length === 0) {
        el.innerHTML = `<li class="mr-empty">Adicione participantes para ver o ranking ao vivo.</li>`;
        return;
    }
    const sorted = [...state.participants].sort((a, b) => getTotalScore(b.id) - getTotalScore(a.id));
    el.innerHTML = sorted.slice(0, 8).map((p, i) => {
        const medal = medalFor(i + 1);
        return `
        <li class="mr-row ${i < 3 ? 'top' : ''}">
            <span class="pos">${medal || (i + 1)}</span>
            <span class="nm">${p.name}</span>
            <span class="pt">${getTotalScore(p.id)}</span>
        </li>`;
    }).join('');
}

function renderRanking() {
    const tbody = document.getElementById('rankingBody');
    const podium = document.getElementById('rankingPodium');
    const sorted = [...state.participants].sort((a, b) => getTotalScore(b.id) - getTotalScore(a.id));

    // ---- PÓDIO (top 3) ----
    if (podium) {
        if (sorted.length === 0) {
            podium.innerHTML = '';
        } else {
            const order = [sorted[1], sorted[0], sorted[2]]; // 2º, 1º, 3º
            const place = ['p2', 'p1', 'p3'];
            const medal = ['🥈', '🥇', '🥉'];
            podium.innerHTML = order.map((p, i) => {
                if (!p) return `<div class="pod ${place[i]}" style="visibility:hidden"></div>`;
                const c = colorFor(p.id + p.name);
                return `
                <div class="pod ${place[i]}" style="--pa:${c.a};--pb:${c.b}">
                    <span class="pod-medal">${medal[i]}</span>
                    <div class="pod-av">${initialOf(p.name)}</div>
                    <div class="pod-name">${p.name}</div>
                    <div class="pod-pts">${getTotalScore(p.id)}<small> pts</small></div>
                </div>`;
            }).join('');
        }
    }

    // ---- TABELA ----
    if (sorted.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--muted-2);padding:30px">Nenhum participante ainda.</td></tr>`;
    } else {
        tbody.innerHTML = sorted.map((p, i) => {
            const medal = medalFor(i + 1);
            const breakdown = getScoreBreakdown(p.id);
            return `
                <tr class="${i === 0 ? 'is-first' : ''}">
                    <td><span class="pos-cell">${medal ? `<span class="medal">${medal}</span>` : ''} ${i + 1}</span></td>
                    <td><strong>${p.name}</strong></td>
                    <td class="col-total">${getTotalScore(p.id)}</td>
                    <td>${breakdown.grupos}</td>
                    <td>${breakdown.knockouts}</td>
                    <td>${breakdown.overall}</td>
                    <td>${breakdown.goldenTipps}</td>
                </tr>`;
        }).join('');
    }

    // carimbo de atualização
    const upd = document.getElementById('updTime');
    if (upd) {
        const now = new Date();
        upd.textContent = 'Atualizado em ' + now.toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'}) +
            ' às ' + now.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
    }

    renderMiniRanking();
}

// ====================
// REVELAÇÃO DE PALPITES (após bloqueio, todos veem os palpites de todos)
// ====================

// Bloco "Resultado final" — mostra o placar real quando o resultado já saiu.
function resultadoFinalHtml(gameId) {
    const r = state.gameResults[gameId];
    if (!r || r.homeGoals === undefined || r.homeGoals === null) return '';
    const jogo  = findGame(gameId);
    const home  = jogo?.home || '';
    const away  = jogo?.away || '';
    const advHtml = r.advancedTeam
        ? `<div class="res-adv">Avança: ${flagFor(r.advancedTeam)} ${r.advancedTeam}</div>` : '';
    return `<div class="result-box">
        <div class="res-head">✅ Resultado final</div>
        <div class="res-score">
            <span class="res-team">${flagFor(home)} ${home}</span>
            <span class="res-pts">${r.homeGoals} – ${r.awayGoals}</span>
            <span class="res-team">${away} ${flagFor(away)}</span>
        </div>
        ${advHtml}
    </div>`;
}

function revealGameHtml(gameId, isKnockout) {
    const linhas = state.participants.map(p => {
        const pred   = state.gamesPredictions[p.id]?.[gameId];
        const placar = pred?.winner || '';
        if (!placar) return null;
        const isMe = p.id === currentParticipantId;
        const gold = (isKnockout && isGolden(p.id, gameId)) ? `<span class="rv-gold">⭐ Golden</span>` : '';
        const adv  = (isKnockout && pred.advanceTeam)
            ? `<span class="rv-adv">avança: ${flagFor(pred.advanceTeam)} ${pred.advanceTeam}</span>` : '';
        return `<div class="rv-row${isMe ? ' me' : ''}">
            <span class="rv-nm">${p.name}${isMe ? ' <em>(você)</em>' : ''}</span>
            <span class="rv-placar">${placar}</span>
            ${gold}${adv}
        </div>`;
    }).filter(Boolean);

    const corpo = linhas.length ? linhas.join('') : `<div class="rv-empty">Ninguém palpitou neste jogo.</div>`;
    // "Resultado final" aparece logo abaixo do palpite e antes dos palpites de todos.
    return `${resultadoFinalHtml(gameId)}<div class="reveal-box"><div class="rv-head">👁 Palpites revelados</div>${corpo}</div>`;
}

function revealOverallHtml() {
    const cats = [
        ['topScorer', '🏆 Artilheiro'],
        ['finalist1', '🥈 Finalista 1'],
        ['finalist2', '🥈 Finalista 2'],
        ['winner',    '🏆 Campeão']
    ];
    const rows = state.participants.map(p => {
        const ov   = state.overallPredictions[p.id] || {};
        const isMe = p.id === currentParticipantId;
        const cells = cats.map(([k]) => `<td>${ov[k] || '—'}</td>`).join('');
        return `<tr class="${isMe ? 'me' : ''}"><td><strong>${p.name}${isMe ? ' (você)' : ''}</strong></td>${cells}</tr>`;
    }).join('');
    return `<div class="reveal-table-wrap">
        <table class="reveal-table">
            <thead><tr><th>Participante</th>${cats.map(([,l]) => `<th>${l}</th>`).join('')}</tr></thead>
            <tbody>${rows}</tbody>
        </table>
    </div>`;
}

function renderOverall() {
    const container = document.getElementById('overallContainer');
    if (state.participants.length === 0) {
        container.innerHTML = `<div class="empty-hint">Adicione participantes na aba Home para liberar as previsões gerais.</div>`;
        return;
    }

    const locked = isOverallLocked();
    const dis    = locked ? 'disabled' : '';

    // Banner de prazo
    let prazoHtml = '';
    if (locked) {
        prazoHtml = `<div style="background:#e63946;color:white;padding:14px 18px;border-radius:10px;margin-bottom:16px;font-weight:700;font-size:1em;">
            🔒 Prazo encerrado — Previsões gerais fecharam em 11/06 às 15h30 (abertura da Copa)
        </div>`;
    } else {
        const diff = DEADLINE_PREVISOES - new Date();
        const dias  = Math.floor(diff / (1000 * 60 * 60 * 24));
        const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const min   = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const resto = dias > 0 ? `${dias}d ${horas}h` : (horas > 0 ? `${horas}h ${min}min` : `${min}min`);
        prazoHtml = `<div style="background:#2a9d8f;color:white;padding:12px 18px;border-radius:10px;margin-bottom:16px;font-weight:600;">
            ⏳ Prazo para previsões gerais: <strong>11/06 às 15h30</strong> (antes da abertura) — faltam ${resto}
        </div>`;
    }

    let html = prazoHtml;

    // BLOQUEADO → revela as previsões de todos os participantes
    if (locked) {
        html += `<div class="info-box" style="border-left-color:var(--gold)"><span>🔓 Prazo encerrado — agora todos veem as previsões de todos.</span></div>`;
        html += revealOverallHtml();
        container.innerHTML = html;
        return;
    }

    // ABERTO → apenas o participante logado vê/edita o próprio formulário
    const participantsToShow = state.participants.filter(p => p.id === currentParticipantId);

    participantsToShow.forEach(participant => {
        const overall = state.overallPredictions[participant.id] || {};
        const c = colorFor(participant.id + participant.name);
        const done = !!(overall.topScorer || overall.finalist1 || overall.finalist2 || overall.winner);

        html += `<div class="participant-predictions ${locked ? 'locked' : ''}">
            <h4><span style="background:linear-gradient(145deg,${c.a},${c.b})"></span>${participant.name}
                ${done ? '<span class="saved-hint">salvo automaticamente</span>' : ''}
                ${locked ? '<span style="color:#e63946;font-size:0.8em;margin-left:8px;">🔒 Encerrado</span>' : ''}</h4>
            <div class="bet-grid">
            <div class="bet-card">
                <label>🏆 Artilheiro da Copa <span class="pts-pill">50 pts</span></label>
                <select class="bet-select" ${dis} onchange="setOverallPrediction(${participant.id}, 'topScorer', this.value)">
                    <option value="">— Selecione —</option>`;

        Object.entries(ELENCOS_COMPLETOS).forEach(([pais, jogadores]) => {
            html += `<optgroup label="${pais}">`;
            jogadores.forEach(jogador => {
                const selected = overall.topScorer === jogador ? 'selected' : '';
                html += `<option value="${jogador}" ${selected}>${jogador}</option>`;
            });
            html += `</optgroup>`;
        });

        html += `</select></div>
            <div class="bet-card">
                <label>🥈 Finalista 1 <span class="pts-pill">25 pts</span></label>
                <select class="bet-select" ${dis} onchange="setOverallPrediction(${participant.id}, 'finalist1', this.value)">
                    <option value="">— Selecione —</option>`;

        Object.keys(ELENCOS_COMPLETOS).forEach(pais => {
            const selected = overall.finalist1 === pais ? 'selected' : '';
            html += `<option value="${pais}" ${selected}>${pais}</option>`;
        });

        html += `</select></div>
            <div class="bet-card">
                <label>🥈 Finalista 2 <span class="pts-pill">25 pts</span></label>
                <select class="bet-select" ${dis} onchange="setOverallPrediction(${participant.id}, 'finalist2', this.value)">
                    <option value="">— Selecione —</option>`;

        Object.keys(ELENCOS_COMPLETOS).forEach(pais => {
            const selected = overall.finalist2 === pais ? 'selected' : '';
            html += `<option value="${pais}" ${selected}>${pais}</option>`;
        });

        html += `</select></div>
            <div class="bet-card">
                <label>🏆 Campeão <span class="pts-pill">25 pts</span></label>
                <select class="bet-select" ${dis} onchange="setOverallPrediction(${participant.id}, 'winner', this.value)">
                    <option value="">— Selecione —</option>`;

        Object.keys(ELENCOS_COMPLETOS).forEach(pais => {
            const selected = overall.winner === pais ? 'selected' : '';
            html += `<option value="${pais}" ${selected}>${pais}</option>`;
        });

        html += `</select></div>
            </div></div>`;
    });

    container.innerHTML = html;
}

// ====================
// RENDER GAME PHASES
// ====================

function renderGroupStage() {
    const container = document.getElementById('grupos');
    let html = `<h2 class="section-title"><svg class="ti-ic"><use href="#ic-grupos"></use></svg> Fase de Grupos</h2>
        <div class="info-box"><span><strong>Pontuação:</strong> Placar exato = 10 pts · Placar + saldo de gols = 6 pts · Só o vencedor = 4 pts · <em>(sem multiplicador)</em></span></div>`;

    if (state.participants.length === 0) {
        html += `<div class="empty-hint">Adicione participantes na aba Home para começar os palpites de grupos.</div>`;
        container.innerHTML = html;
        return;
    }

    // Apenas o participante logado vê seus palpites
    const curParticipant = getCurrentParticipant();
    if (!curParticipant) { container.innerHTML = html; return; }

    [curParticipant].forEach(participant => {
        const c = colorFor(participant.id + participant.name);
        html += `<div class="player-block">
            <div class="pb-name"><span class="av" style="background:linear-gradient(145deg,${c.a},${c.b})">${initialOf(participant.name)}</span>${participant.name}</div>`;

        Object.entries(GRUPOS_COPA_2026).forEach(([letra, grupo]) => {
            html += `<div class="group-block">
                <div class="gh"><span class="badge">${letra}</span><span class="gt">${grupo.times.join(' · ')}</span></div>`;

            grupo.jogos.forEach(jogo => {
                const { h, a } = splitPlacar(getGamePrediction(participant.id, jogo.id, 'winner'));
                const filled  = h !== '' && a !== '';
                const locked  = isGameLocked(jogo.id);
                const dis     = locked ? 'disabled' : '';
                const lockCls = locked ? 'locked' : '';
                const badge   = badgeBloqueio(jogo.id);
                html += `<div class="match-row ${filled ? 'done' : ''} ${lockCls}" id="row-${participant.id}-${jogo.id}">
                    <div class="team home"><span class="tn">${jogo.home}</span><span class="tflag">${flagFor(jogo.home)}</span></div>
                    <div class="placar-col">
                        <div class="placar">
                            <input type="number" min="0" class="placar-input" value="${h}" ${dis} onchange="setPlacar(${participant.id},'${jogo.id}','h',this.value)">
                            <span class="placar-sep">–</span>
                            <input type="number" min="0" class="placar-input" value="${a}" ${dis} onchange="setPlacar(${participant.id},'${jogo.id}','a',this.value)">
                        </div>
                        <div class="match-date ${filled ? 'ok' : ''}" id="dt-${participant.id}-${jogo.id}">${fmtData(jogo.data)} ${jogo.hora}h ${badge}</div>
                    </div>
                    <div class="team away"><span class="tflag">${flagFor(jogo.away)}</span><span class="tn">${jogo.away}</span></div>
                </div>`;
                // Jogo bloqueado → revela os palpites de todos
                if (locked) html += revealGameHtml(jogo.id, false);
            });

            html += `</div>`;
        });

        html += `</div>`;
    });

    container.innerHTML = html;
}

function renderKnockoutPhase(phaseName) {
    const phase = KNOCKOUT_STAGES_2026[phaseName];
    const containerId = phaseName === '16avos' ? 'r16' : phaseName;
    const container = document.getElementById(containerId);
    const multiplier = GAME_MULTIPLIERS[phaseName];
    const titles = {
        '16avos':['ic-bracket','16avos de Final'], 'oitavas':['ic-bracket','Oitavas de Final'],
        'quartas':['ic-bracket','Quartas de Final'], 'semis':['ic-bracket','Semifinais'], 'final':['ic-trophy','Final & 3º Lugar']
    };
    const ti = titles[phaseName] || ['ic-bracket', phase.nome];

    const goldenMax = 10 * multiplier * 3;
    let html = `<div class="phase-banner">
            <div class="pb-title"><svg class="pb-ic"><use href="#${ti[0]}"></use></svg> ${ti[1]}</div>
            <div class="pb-meta"><span class="mult-badge">${multiplier}×</span><span class="pts-hint">até ${10 * multiplier} pts por jogo</span></div>
        </div>
        <div class="info-box"><span><strong>Pontuação:</strong> Placar exato = ${10 * multiplier} · Placar + saldo = ${6 * multiplier} · Só vencedor = ${4 * multiplier} · Quem avança = +${2 * multiplier}</span></div>
        <div class="golden-warn">
            <div class="gw-icon">⭐</div>
            <div class="gw-body">
                <div class="gw-title">Golden Tipp — aposta de tudo ou nada</div>
                <ul class="gw-list">
                    <li>Você tem <strong>3 Golden Tipps</strong> para usar em todo o mata-mata.</li>
                    <li>Marque um jogo como Golden e, se acertar o <strong>placar exato</strong>, ganha <strong>3× os pontos</strong> — aqui valeria <strong>${goldenMax} pts</strong>!</li>
                    <li>⚠️ Se <strong>não</strong> acertar o placar exato, esse jogo vale <strong>0 ponto</strong> (você perde até os pontos normais que faria).</li>
                    <li>Use no botão <strong>⭐ Golden Tipp</strong> de cada jogo. Guarde para os jogos que você tem mais certeza!</li>
                </ul>
            </div>
        </div>`;

    if (state.participants.length === 0) {
        html += `<div class="empty-hint">Adicione participantes na aba Home para palpitar no mata-mata.</div>`;
        container.innerHTML = html;
        return;
    }

    // Apenas o participante logado vê seus palpites
    const koParticipant = getCurrentParticipant();
    if (!koParticipant) { container.innerHTML = html; return; }

    [koParticipant].forEach(participant => {
        const c = colorFor(participant.id + participant.name);
        const goldenCount = (state.goldenTipps[participant.id] || []).length;
        html += `<div class="player-block">
            <div class="pb-name"><span class="av" style="background:linear-gradient(145deg,${c.a},${c.b})">${initialOf(participant.name)}</span>${participant.name}
                <span class="rank-badge" style="margin-left:auto">⭐ ${goldenCount}/3 Golden</span></div>`;

        phase.jogos.forEach(jogo => {
            const { h, a } = splitPlacar(getGamePrediction(participant.id, jogo.id, 'winner'));
            const adv     = getGamePrediction(participant.id, jogo.id, 'advanceTeam') || '';
            const gold    = isGolden(participant.id, jogo.id);
            const filled  = h !== '' && a !== '';
            const locked  = isGameLocked(jogo.id);
            const dis     = locked ? 'disabled' : '';
            const badge   = badgeBloqueio(jogo.id);
            const lockCls = locked ? 'locked' : '';
            html += `<div class="ko-match ${gold ? 'golden' : ''} ${lockCls}">
                <div class="match-row" id="row-${participant.id}-${jogo.id}" style="background:transparent;border:none;padding:0;margin:0 0 4px">
                    <div class="team home"><span class="tn">${jogo.home}</span><span class="tflag">${flagFor(jogo.home)}</span></div>
                    <div class="placar-col">
                        <div class="placar">
                            <input type="number" min="0" class="placar-input" value="${h}" ${dis} onchange="setPlacar(${participant.id},'${jogo.id}','h',this.value)">
                            <span class="placar-sep">–</span>
                            <input type="number" min="0" class="placar-input" value="${a}" ${dis} onchange="setPlacar(${participant.id},'${jogo.id}','a',this.value)">
                        </div>
                        <div class="match-date ${filled ? 'ok' : ''}" id="dt-${participant.id}-${jogo.id}">${fmtData(jogo.data)} ${jogo.hora}h ${badge}</div>
                    </div>
                    <div class="team away"><span class="tflag">${flagFor(jogo.away)}</span><span class="tn">${jogo.away}</span></div>
                </div>
                <div class="match-meta">
                    <div class="ko-advance">
                        <span class="lab">Quem avança?</span>
                        <select class="bet-select" ${dis} onchange="setGamePrediction(${participant.id},'${jogo.id}','advanceTeam',this.value)">
                            <option value="">— Selecione —</option>
                            <option value="${jogo.home}" ${adv === jogo.home ? 'selected' : ''}>${flagFor(jogo.home)} ${jogo.home}</option>
                            <option value="${jogo.away}" ${adv === jogo.away ? 'selected' : ''}>${flagFor(jogo.away)} ${jogo.away}</option>
                        </select>
                        <span class="adv-pill">+${2 * multiplier} pts</span>
                    </div>
                    <button class="golden-btn ${gold ? 'on' : ''}" ${dis} onclick="toggleGolden(${participant.id},'${jogo.id}','${phaseName}')">⭐ Golden Tipp</button>
                </div>
            </div>`;
            // Jogo bloqueado → revela os palpites de todos
            if (locked) html += revealGameHtml(jogo.id, true);
        });

        html += `</div>`;
    });

    container.innerHTML = html;
}

// ====================
// NAVIGATION
// ====================

function switchTab(tabName) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

    document.getElementById(tabName).classList.add('active');

    // Find and activate the matching button
    document.querySelectorAll('.nav-btn').forEach(btn => {
        const dataTab = btn.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
        if (dataTab === tabName) {
            btn.classList.add('active');
        }
    });

    // Atualiza título da topbar (ícone + nome)
    const TITLES = {
        home:['ic-home','Home'], overall:['ic-prev','Previsões Gerais'], grupos:['ic-grupos','Fase de Grupos'],
        r16:['ic-bracket','16avos de Final'], oitavas:['ic-bracket','Oitavas de Final'], quartas:['ic-bracket','Quartas de Final'],
        semis:['ic-bracket','Semifinais'], final:['ic-trophy','Final'], ranking:['ic-ranking','Classificação']
    };
    const pt = document.getElementById('pageTitle');
    if (pt && TITLES[tabName]) pt.innerHTML = `<svg class="ti-ic"><use href="#${TITLES[tabName][0]}"></use></svg> ${TITLES[tabName][1]}`;
    // scroll content topo
    const content = document.querySelector('.content');
    if (content) content.scrollTop = 0;
    window.scrollTo(0, 0);

    // Abas de palpites exigem login
    const PRED_TABS = ['overall','grupos','r16','oitavas','quartas','semis','final'];
    if (PRED_TABS.includes(tabName) && !isLoggedIn()) {
        // Na aba 'overall' o aviso vai DENTRO do container (preserva o cabeçalho da seção);
        // nas demais, o render reescreve a seção inteira no próximo acesso.
        const target = tabName === 'overall'
            ? document.getElementById('overallContainer')
            : document.getElementById(tabName);
        target.innerHTML = `
            <div style="text-align:center;padding:60px 20px;">
                <div style="font-size:3em;margin-bottom:16px;">🔐</div>
                <h3 style="margin-bottom:12px;">Entre com seu PIN para fazer palpites</h3>
                <p style="color:#9aa4ba;margin-bottom:24px;">O ranking é público, mas os palpites são privados.</p>
                <button onclick="openLoginModal()" style="background:#FFD700;color:#1a1a2e;border:none;border-radius:30px;padding:14px 32px;font-size:1em;font-weight:700;cursor:pointer;">
                    🔑 Entrar com PIN
                </button>
            </div>`;
        return;
    }

    // Render content based on tab
    if (tabName === 'ranking') {
        renderRanking();
    } else if (tabName === 'overall') {
        renderOverall();
    } else if (tabName === 'grupos') {
        renderGroupStage();
    } else if (tabName === 'r16') {
        renderKnockoutPhase('16avos');
    } else if (tabName === 'oitavas') {
        renderKnockoutPhase('oitavas');
    } else if (tabName === 'quartas') {
        renderKnockoutPhase('quartas');
    } else if (tabName === 'semis') {
        renderKnockoutPhase('semis');
    } else if (tabName === 'final') {
        renderKnockoutPhase('final');
    } else if (tabName === 'home') {
        renderParticipants();
    }

    renderMiniRanking();
}

// ====================
// EXPORTAR CSV DE PALPITES
// ====================

function getFaseByGameId(gameId) {
    for (const [fase, data] of Object.entries(KNOCKOUT_STAGES_2026)) {
        if (data.jogos.some(j => j.id === gameId)) return fase;
    }
    for (const [letra, grupo] of Object.entries(GRUPOS_COPA_2026)) {
        if (grupo.jogos.some(j => j.id === gameId)) return `grupo_${letra}`;
    }
    return 'desconhecido';
}

function getGameLabel(gameId) {
    for (const [letra, grupo] of Object.entries(GRUPOS_COPA_2026)) {
        const jogo = grupo.jogos.find(j => j.id === gameId);
        if (jogo) return `${jogo.home} x ${jogo.away}`;
    }
    for (const stage of Object.values(KNOCKOUT_STAGES_2026)) {
        const jogo = stage.jogos.find(j => j.id === gameId);
        if (jogo) return `${jogo.home} x ${jogo.away}`;
    }
    return gameId;
}

function exportarPalpitesCSV() {
    // Contém os palpites de TODOS — exportação restrita ao administrador
    const pin = prompt('PIN do administrador para exportar:');
    if (pin !== ADMIN_PIN) { alert('Apenas o administrador pode exportar os palpites.'); return; }
    const agora = new Date().toISOString();
    const linhas = [
        ['data_export', 'participante', 'jogo_id', 'jogo_descricao', 'fase',
         'palpite_placar', 'palpite_avanco', 'resultado_real', 'resultado_avanco',
         'score_obtido', 'data_jogo']
    ];

    state.participants.forEach(participant => {
        const preds = state.gamesPredictions[participant.id] || {};

        // Jogos de grupo
        Object.values(GRUPOS_COPA_2026).forEach(grupo => {
            grupo.jogos.forEach(jogo => {
                const pred = preds[jogo.id];
                const result = state.gameResults[jogo.id];
                const score = calculateScoreGame(participant.id, jogo.id);
                linhas.push([
                    agora, participant.name, jogo.id,
                    `"${jogo.home} x ${jogo.away}"`,
                    `grupo`, pred?.winner || '', pred?.advanceTeam || '',
                    result ? `${result.homeGoals}-${result.awayGoals}` : '',
                    result?.advancedTeam || '', score, jogo.data
                ]);
            });
        });

        // Jogos de knockout
        Object.entries(KNOCKOUT_STAGES_2026).forEach(([fase, stage]) => {
            stage.jogos.forEach(jogo => {
                const pred = preds[jogo.id];
                const result = state.gameResults[jogo.id];
                const score = calculateScoreGame(participant.id, jogo.id);
                linhas.push([
                    agora, participant.name, jogo.id,
                    `"${jogo.home} x ${jogo.away}"`,
                    fase, pred?.winner || '', pred?.advanceTeam || '',
                    result ? `${result.homeGoals}-${result.awayGoals}` : '',
                    result?.advancedTeam || '', score, jogo.data
                ]);
            });
        });
    });

    const csv = linhas.map(row => row.join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `palpites_bolao_${agora.split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function exportarPrevisoesCsv() {
    const pin = prompt('PIN do administrador para exportar:');
    if (pin !== ADMIN_PIN) { alert('Apenas o administrador pode exportar as previsões.'); return; }
    const agora = new Date().toISOString();
    const linhas = [
        ['data_export', 'participante', 'artilheiro_palpite', 'artilheiro_real',
         'finalista1_palpite', 'finalista2_palpite', 'finalistas_reais',
         'campeao_palpite', 'campeao_real', 'score_geral']
    ];
    state.participants.forEach(p => {
        const pred = state.overallPredictions[p.id] || {};
        const res = state.overallResults || {};
        linhas.push([
            agora, p.name,
            pred.topScorer || '', res.topScorer || '',
            pred.finalist1 || '', pred.finalist2 || '',
            [res.finalist1, res.finalist2].filter(Boolean).join(' / '),
            pred.winner || '', res.winner || '',
            calculateScoreOverall(p.id)
        ]);
    });
    const csv = linhas.map(row => row.join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `previsoes_gerais_${agora.split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ====================
// INIT
// ====================

document.addEventListener('DOMContentLoaded', async () => {
    loadState();
    // Puxar cadastros e palpites da nuvem ANTES de restaurar a sessão
    await fetchRemoteState();
    restoreSession();
    // Autorreparo: regrava o próprio cadastro na nuvem (evita "fantasmas" sem nome)
    await selfHealParticipant();
    renderParticipants();
    // Resultados dos jogos (atualizado diariamente pelo GitHub Actions)
    try {
        await carregarResultadosRemotos();
    } catch(e) {
        console.log('Resultados remotos não disponíveis:', e.message);
    }
    renderParticipants();

    // Sincronização periódica: ranking ao vivo entre os participantes
    if (syncOn()) {
        setInterval(async () => {
            await fetchRemoteState();
            renderParticipants();
            const rk = document.getElementById('ranking');
            if (rk && rk.classList.contains('active')) renderRanking();
        }, 45000);
    }
});
