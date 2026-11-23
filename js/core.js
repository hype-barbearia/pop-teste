/* =========================================================
   Núcleo: data e hora de Recife, formatação e utilitários
   ========================================================= */
const TZ_OFF = -180;                                   // America/Recife, UTC-3, sem horário de verão
const DAY_START = 8 * 60, DAY_END = 21 * 60;
const WEEK = ['dom','seg','ter','qua','qui','sex','sáb'];
const WEEK_FULL = ['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado'];
const MESES = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const recife = (ms = Date.now()) => new Date(ms + TZ_OFF * 60000);   // ler sempre com getUTC*
const minOf = iso => { if (!iso) return null; const d = recife(Date.parse(iso)); return d.getUTCHours() * 60 + d.getUTCMinutes(); };
const nowMin = () => { const d = recife(); return d.getUTCHours() * 60 + d.getUTCMinutes(); };
let TODAY_ISO, TODAY_WD, DIA_LABEL, DIA_CURTO;
function setToday(){
  const d = recife(), dd = String(d.getUTCDate()).padStart(2, '0'), mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  TODAY_ISO = d.toISOString().slice(0, 10); TODAY_WD = d.getUTCDay();
  DIA_LABEL = `${WEEK_FULL[TODAY_WD]}, ${d.getUTCDate()} de ${MESES[d.getUTCMonth()]} de ${d.getUTCFullYear()}`;
  DIA_CURTO = `${WEEK[TODAY_WD]}, ${dd}/${mm}`;
}
const isoMinus = days => recife(Date.now() - days * 864e5).toISOString().slice(0, 10);
const dLabelISO = iso => iso.slice(8, 10) + '/' + iso.slice(5, 7);
setToday();

const toMin = s => { const [h, m] = String(s).split(':').map(Number); return h * 60 + (m || 0); };
const hm = m => m == null ? '' : String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(Math.round(m % 60)).padStart(2, '0');
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pct = (v, d = 0) => ((v || 0) * 100).toLocaleString('pt-BR', {minimumFractionDigits:d, maximumFractionDigits:d}) + '%';
const nf = (v, d = 0) => (v || 0).toLocaleString('pt-BR', {minimumFractionDigits:d, maximumFractionDigits:d});
const sum = (a, f = x => x) => a.reduce((t, x) => t + (f(x) || 0), 0);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const firstName = n => String(n).split(' ')[0];
const initials = n => String(n).split(' ').map(x => x[0]).slice(0, 2).join('');
const nf2 = v => Number(v || 0).toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2});
const fmtCnpj = c => { const d = String(c || '').replace(/\D/g, ''); return d.length === 14 ? `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}` : c; };
const mins = m => m < 60 ? `${Math.round(m)} min` : `${Math.floor(m / 60)}h${String(Math.round(m % 60)).padStart(2, '0')}`;
