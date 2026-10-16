// Раздел тревел-эксперта «Заявки на бронирование» v2 (16.10.2026): таблица как в ЛК, фильтры статуса и даты,
// сортировка по ID, окно «Информация о бронировании», подтверждение и отказ, мобильные шторки
(() => {
  const root = document.getElementById('orders');
  if (!root) return;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const params = new URLSearchParams(location.search);
  const mobile = () => matchMedia('(max-width: 640px)').matches;

  const plural = (n, [one, few, many]) => { const a = n % 10, b = n % 100; return n + ' ' + (a === 1 && b !== 11 ? one : a >= 2 && a <= 4 && (b < 12 || b > 14) ? few : many); };
  const people = (n) => plural(n, ['участник', 'участника', 'участников']);
  const rub = (n) => n.toLocaleString('ru-RU').replace(/\s/g, ' ') + ' ₽';
  const MS = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  const ML = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  const dShort = (iso) => { const d = new Date(iso); return `${d.getDate()} ${MS[d.getMonth()]}`; };

  // ---- Данные как на экранах Figma ----
  const KAM = ['Земля Камчатка. Вулканы, термальные источники', '2–9 ноября 2026'];
  const BAI = ['Байкальский лёд: Ольхон и Листвянка', '12–16 марта 2027'];
  const DAG = ['Дагестан: Сулакский каньон и древний Дербент', '14–19 ноября 2026'];
  const ALT = ['Алтай: Чуйский тракт и Мультинские озёра', '3–10 августа 2026'];
  const ORDERS = root.hasAttribute('data-empty') ? [] : [
    { id: 131925, at: '2026-10-14', name: 'Ольга', parts: ['женщина, 34 года', 'мужчина, 36 лет'], tour: KAM, st: 'pending', pay: 'none', price: 248000 },
    { id: 131917, at: '2026-10-13', name: 'Алексей', parts: ['мужчина, 29 лет'], tour: BAI, st: 'pending', pay: 'none', price: 96000 },
    { id: 131910, at: '2026-10-13', name: 'Игорь', parts: ['мужчина, 41 год', 'женщина, 39 лет', 'девочка, 12 лет', 'мальчик, 9 лет'], tour: KAM, st: 'pending', pay: 'none', price: 496000 },
    { id: 131860, at: '2026-10-09', name: 'Наталья', parts: ['женщина, 41 год', 'мужчина, 43 года'], tour: KAM, st: 'confirmed', pay: 'pre', price: 248000, contacts: ['+7 912 345-67-89', 'natalia.k@mail.ru'] },
    { id: 131842, at: '2026-10-07', name: 'Ксения', parts: ['женщина, 27 лет'], tour: KAM, st: 'auto', pay: 'none', price: 124000 },
    { id: 131833, at: '2026-10-05', name: 'Антон', parts: ['мужчина, 31 год', 'женщина, 30 лет'], tour: KAM, st: 'declined', pay: 'none', price: 248000 },
    { id: 131788, at: '2026-10-03', name: 'Марина', parts: ['женщина, 38 лет', 'мужчина, 40 лет', 'женщина, 64 года'], tour: DAG, st: 'confirmed', pay: 'second', price: 237000, contacts: ['+7 903 555-12-40', 'marina.dag@yandex.ru'] },
    { id: 131701, at: '2026-07-02', name: 'Павел', parts: ['мужчина, 44 года', 'женщина, 42 года'], tour: ALT, st: 'finished', pay: 'second', price: 210000, contacts: ['+7 916 200-44-18', 'pavel.alt@mail.ru'] },
    { id: 131655, at: '2026-10-01', name: 'Елена', parts: ['женщина, 52 года'], tour: DAG, st: 'client', pay: 'pre', price: 79000 },
  ];
  const ST = { pending: 'Ожидает подтверждения', confirmed: 'Подтверждено', finished: 'Тур завершен', declined: 'Отклонено', client: 'Отменено клиентом', auto: 'Отменено автоматически' };
  const PAY = { none: 'Не оплачен', pre: 'Предоплата внесена', second: 'Внесена вторая часть' };
  const payLine = (o) => o.st === 'auto' ? 'Истек срок оплаты' : PAY[o.pay];
  const STATUS_FILTER = { confirmed: ['confirmed'], pending: ['pending'], declined: ['declined'] };

  const ICON = { chat: '<img src="assets/or2-chat.svg" alt="" width="20" height="20">', profile: '<img src="assets/or2-profile.svg" alt="" width="20" height="20">', doc: '<img src="assets/or2-doc.svg" alt="" width="20" height="20">' };
  const actions = (o) => {
    const chat = `<button class="or2-btn or2-btn--grey" type="button" data-toast="Чат с&nbsp;путешественником: вне тестового">${ICON.chat}Чат</button>`;
    if (o.st === 'pending') return chat + `<div class="or2-pair"><button class="or2-btn or2-btn--green" type="button" data-act="confirm" data-id="${o.id}">Подтвердить</button><button class="or2-btn or2-btn--white" type="button" data-act="reject" data-id="${o.id}">Отклонить</button></div>`;
    if (o.st === 'confirmed' && o.pay !== 'none') return chat + `<button class="or2-btn or2-btn--white" type="button" data-act="info" data-id="${o.id}">${ICON.profile}Контакты</button>`;
    if (o.st === 'finished') return chat + `<button class="or2-btn or2-btn--white" type="button" data-toast="Акт по&nbsp;завершённой брони: уточняем у&nbsp;клиента">${ICON.doc}Акт</button>`;
    return chat;
  };

  // ---- Состояние фильтров и сортировки ----
  const state = { status: new Set(), range: null, dir: 'desc' };
  const visible = () => ORDERS.filter((o) => (!state.status.size || [...state.status].some((k) => STATUS_FILTER[k].includes(o.st)))
    && (!state.range || (o.at >= state.range[0] && o.at <= state.range[1])))
    .sort((a, b) => state.dir === 'desc' ? b.id - a.id : a.id - b.id);

  const rowsEl = $('#or2-rows'), tableEl = $('#or2-table'), nfEl = $('#or2-nf'), emptyEl = $('#or2-empty');
  const render = () => {
    if (!ORDERS.length) { tableEl.hidden = true; nfEl.hidden = true; emptyEl.hidden = false; $('#or2-filters').hidden = true; $('.or2-mfilters').hidden = true; return; }
    const list = visible();
    tableEl.hidden = !list.length; nfEl.hidden = !!list.length;
    rowsEl.innerHTML = list.map((o) => `
      <div class="or2-row" data-row="${o.id}">
        <div class="or2-cell or2-c--id"><button class="or2-id" type="button" data-act="info" data-id="${o.id}"><span class="m-only">Заказ </span>${o.id}</button><p class="or2-sub">${dShort(o.at)}</p></div>
        <div class="or2-cell or2-c--trav"><p class="or2-main">${o.name}</p><p class="or2-sub">${people(o.parts.length)}</p></div>
        <div class="or2-cell or2-c--tour"><p class="or2-main or2-clamp">${o.tour[0]}</p><p class="or2-sub">${o.tour[1]}</p></div>
        <div class="or2-cell or2-c--st"><p class="or2-main or2-st--${o.st}">${ST[o.st]}</p><p class="or2-sub">${payLine(o)}</p></div>
        <div class="or2-cell or2-c--act">${actions(o)}</div>
      </div>`).join('');
    // подписи фильтров
    const sv = [...state.status].map((k) => ({ confirmed: 'Подтверждено', pending: 'Ожидает подтверждения', declined: 'Отклонено' }[k]));
    $('[data-key="status"] [data-label]').textContent = sv.length ? `Статус бронирования: ${sv.length === 1 ? sv[0] : sv.length}` : 'Статус бронирования';
    $('[data-key="date"] [data-label]').textContent = state.range ? `Дата бронирования: ${rangeText(state.range, true)}` : 'Дата бронирования';
    const n = (state.status.size ? 1 : 0) + (state.range ? 1 : 0);
    $('[data-mlabel]').textContent = n ? `Фильтры · ${n}` : 'Фильтры';
    $('[data-status-v]').textContent = sv.length ? (sv.length === 1 ? sv[0] : sv.length) : 'Все';
    $('[data-date-v]').textContent = state.range ? rangeText(state.range, true) : 'Все';
    $('.or2-sorter').dataset.dir = state.dir;
  };

  // ---- Выпадающие фильтры (десктоп) ----
  const closeDrops = (except) => $$('.or2-filter').forEach((w) => { const d = $('.or2-drop', w); if (!d || w === except) return; d.hidden = true; $('.or2-fbtn', w).setAttribute('aria-expanded', 'false'); });
  $('#or2-filters').addEventListener('click', (e) => {
    const w = e.target.closest('.or2-filter'); if (!w) return;
    const drop = $('.or2-drop', w); if (!drop) return;
    if (e.target.closest('.or2-fbtn')) { closeDrops(w); drop.hidden = !drop.hidden; $('.or2-fbtn', w).setAttribute('aria-expanded', String(!drop.hidden)); if (!drop.hidden && w.dataset.key === 'status') syncChecks(drop); return; }
    if (e.target.closest('[data-clear]')) { $$('input', drop).forEach((i) => { i.checked = false; }); }
    if (e.target.closest('[data-apply]')) { state.status = new Set($$('input:checked', drop).map((i) => i.value)); closeDrops(); render(); }
  });
  document.addEventListener('click', (e) => { if (!e.target.closest('.or2-filter')) closeDrops(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrops(); });
  const syncChecks = (box) => $$('input', box).forEach((i) => { i.checked = state.status.has(i.value); });

  // ---- Календарь ----
  let calMonth = [2026, 9]; let pick = null;
  const iso = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  function rangeText([a, b], short) { const A = new Date(a), B = new Date(b); const same = A.getMonth() === B.getMonth(); return same ? `${A.getDate()}–${B.getDate()} ${ML[B.getMonth()]}${short ? '' : ' ' + B.getFullYear()}` : `${A.getDate()} ${ML[A.getMonth()]} – ${B.getDate()} ${ML[B.getMonth()]}`; }
  const TODAY = '2026-10-16';
  const renderCal = (el) => {
    const [y, m] = calMonth; const first = (new Date(y, m, 1).getDay() + 6) % 7; const days = new Date(y, m + 1, 0).getDate(); const prevDays = new Date(y, m, 0).getDate();
    const cells = [];
    for (let i = first - 1; i >= 0; i--) cells.push([iso(y, m - 1, prevDays - i), prevDays - i, true]);
    for (let d = 1; d <= days; d++) cells.push([iso(y, m, d), d, false]);
    for (let d = 1; cells.length < 42; d++) cells.push([iso(y, m + 1, d), d, true]);
    const r = pick || state.range;
    const cls = ([k, , muted]) => { const c = ['or2-day']; if (muted) c.push('is-muted'); if (k === TODAY) c.push('is-today'); if (r && r[0] && (k === r[0] || k === r[1])) c.push('is-sel'); else if (r && r[1] && k > r[0] && k < r[1]) c.push('is-in'); return c.join(' '); };
    const title = `${['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'][m]} ${y}`;
    el.innerHTML = `<div class="or2-cal__month"><button class="or2-cal__nav" type="button" data-nav="-1" aria-label="Предыдущий месяц"><img src="assets/or2-arrow-l.svg" alt="" width="20" height="20"></button>${title}<button class="or2-cal__nav" type="button" data-nav="1" aria-label="Следующий месяц"><img src="assets/or2-arrow-r.svg" alt="" width="20" height="20"></button></div>
      <div class="or2-cal__grid">${['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((w) => `<span class="or2-cal__wd">${w}</span>`).join('')}${cells.map((c) => `<button class="${cls(c)}" type="button" data-day="${c[0]}">${c[1]}</button>`).join('')}</div>
      <div class="or2-cal__range">Выбрано: <b>${r && r[1] ? rangeText(r) : r && r[0] ? rangeText([r[0], r[0]]) : 'нет'}</b></div>
      <div class="or2-drop__actions"><button class="or2-btn or2-btn--grey" type="button" data-cclear>Очистить</button><button class="or2-btn or2-btn--green" type="button" data-capply>Применить</button></div>`;
  };
  $$('[data-cal]').forEach((el) => el.addEventListener('click', (e) => {
    e.stopPropagation();
    const nav = e.target.closest('[data-nav]'); if (nav) { const [y, m] = calMonth; const d = new Date(y, m + +nav.dataset.nav, 1); calMonth = [d.getFullYear(), d.getMonth()]; return renderCal(el); }
    const day = e.target.closest('[data-day]'); if (day) { const k = day.dataset.day; pick = !pick || pick[1] ? [k, null] : (k < pick[0] ? [k, pick[0]] : [pick[0], k]); return renderCal(el); }
    if (e.target.closest('[data-cclear]')) { pick = null; state.range = null; renderCal(el); return render(); }
    if (e.target.closest('[data-capply]')) { if (pick && pick[0]) state.range = [pick[0], pick[1] || pick[0]]; pick = null; closeDrops(); closeSheet('sh-date'); render(); }
  }));
  const dateDrop = $('[data-key="date"] .or2-drop');
  $('[data-key="date"] .or2-fbtn').addEventListener('click', () => { pick = null; renderCal(dateDrop); });

  // ---- Сортировка по ID ----
  $('.or2-sorter').addEventListener('click', () => { state.dir = state.dir === 'desc' ? 'asc' : 'desc'; render(); });

  // ---- Мобильные шторки ----
  const openSheet = (id) => { const s = document.getElementById(id); s.hidden = false; if (id === 'sh-filters') syncChecks($('[data-acc-body="status"]', s)); if (id === 'sh-date') { pick = null; renderCal($('[data-cal]', s)); } if (id === 'sh-sort') $$('.or2-sortopt', s).forEach((b) => b.setAttribute('aria-checked', String(b.dataset.sort === state.dir))); };
  const closeSheet = (id) => { const s = document.getElementById(id); if (s) s.hidden = true; };
  document.addEventListener('click', (e) => { const b = e.target.closest('[data-sheet]'); if (b) { if (b.dataset.sheet === 'date') closeSheet('sh-filters'); openSheet('sh-' + b.dataset.sheet); } });
  $('#sh-filters').addEventListener('click', (e) => {
    const acc = e.target.closest('[data-acc]'); if (acc) { const body = $(`[data-acc-body="${acc.dataset.acc}"]`); body.hidden = !body.hidden; acc.setAttribute('aria-expanded', String(!body.hidden)); }
    if (e.target.closest('[data-sclear]')) { $$('#sh-filters input').forEach((i) => { i.checked = false; }); state.status.clear(); state.range = null; render(); }
    if (e.target.closest('[data-sapply]')) { state.status = new Set($$('#sh-filters input:checked').map((i) => i.value)); closeSheet('sh-filters'); render(); }
  });
  $('#sh-sort').addEventListener('click', (e) => { const o = e.target.closest('.or2-sortopt'); if (o) { state.dir = o.dataset.sort; $$('.or2-sortopt').forEach((b) => b.setAttribute('aria-checked', String(b === o))); render(); } });

  $('#or2-reset').addEventListener('click', () => { state.status.clear(); state.range = null; render(); });

  // ---- Тост ----
  const toast = document.createElement('div'); toast.className = 'toast'; toast.setAttribute('role', 'status'); document.body.append(toast);
  let tt; const say = (h) => { toast.innerHTML = h; toast.classList.add('is-on'); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('is-on'), 2400); };
  document.addEventListener('click', (e) => { const t = e.target.closest('[data-toast]'); if (t) { e.preventDefault(); e.stopPropagation(); say(t.dataset.toast); } }, true);

  // ---- Окно «Информация о бронировании» ----
  const info = $('#or2-info'); let current = null;
  const fill = (o) => {
    current = o; const half = Math.round(o.price / 2);
    const preOk = o.pay !== 'none', postOk = o.pay === 'second';
    const f = [
      ['Номер заказа', o.id], ['Имя клиента', o.name], ['Название тура', `<a href="#" data-toast="Страница тура: вне тестового">${o.tour[0]}</a>`], ['Забронированные даты', o.tour[1]],
      ['Количество путешественников', o.parts.length], ['Данные участников', o.parts.map((p, i) => `Участник ${i + 1}: ${p}`).join('\n')],
      ['Статус заказа', `<span class="or2-st--${o.st}">${ST[o.st]}</span>`], ['Цена тура', rub(o.price)],
      ['Размер предоплаты', `${rub(half)}<span class="or2-sub${preOk ? ' is-paid' : ''}">${preOk ? 'Оплачена' : 'Не оплачена'}</span>`],
      ['Размер постоплаты', `${rub(o.price - half)}<span class="or2-sub${postOk ? ' is-paid' : ''}">${postOk ? 'Оплачена' : 'Не оплачена'}</span>`],
      ['Списанный автоматически долг', '0 ₽'],
      ['Контакты путешественника', o.contacts && preOk ? o.contacts.join('\n') : '<span class="or2-lock"><img src="assets/or2-info.svg" alt="" width="20" height="20">Откроются после предоплаты</span>'],
    ];
    $('#or2-fields').innerHTML = f.map(([k, v]) => `<div class="or2-field"><dt>${k}</dt><dd>${v}</dd></div>`).join('');
    const chat = `<button class="or2-btn ${mobile() ? 'or2-btn--white' : 'or2-btn--grey'}" type="button" data-toast="Чат с&nbsp;путешественником: вне тестового">${ICON.chat}Перейти в&nbsp;чат</button>`;
    $('#or2-info-actions').innerHTML = o.st === 'pending'
      ? (mobile() ? `<button class="or2-btn or2-btn--green" type="button" data-act="confirm" data-id="${o.id}">Подтвердить</button><button class="or2-btn or2-btn--white" type="button" data-act="reject" data-id="${o.id}">Отклонить</button>${chat}`
        : `${chat}<button class="or2-btn or2-btn--white" type="button" data-act="reject" data-id="${o.id}">Отклонить</button><button class="or2-btn or2-btn--green" type="button" data-act="confirm" data-id="${o.id}">Подтвердить</button>`)
      : chat;
  };
  const openInfo = (o) => { fill(o); info.hidden = false; };

  // ---- Подтверждение и отказ ----
  const dlgC = $('#dlg-confirm'), dlgR = $('#dlg-reject');
  const summary = (o) => `<p><b>Заказ ${o.id}</b> · <b>${o.name}</b>, ${people(o.parts.length)}</p><p>${o.tour[0].split('.')[0]}, <b>${o.tour[1]}</b></p><p>${rub(o.price)}</p>`;
  const openDlg = (kind, o) => { current = o; const d = kind === 'confirm' ? dlgC : dlgR; $('[data-order-summary]', d).innerHTML = summary(o); d.hidden = false; };
  const decide = (st, msg) => { if (!current) return; current.st = st; dlgC.hidden = dlgR.hidden = true; render(); if (!info.hidden) fill(current); say(msg); };
  $('#dlg-confirm-ok').addEventListener('click', () => decide('confirmed', 'Бронирование подтверждено'));
  $('#dlg-reject-ok').addEventListener('click', () => decide('declined', 'Бронирование отклонено'));

  // клики по строкам и кнопкам
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-act][data-id]');
    if (a) { const o = ORDERS.find((x) => x.id === +a.dataset.id); if (a.dataset.act === 'info') openInfo(o); else openDlg(a.dataset.act, o); return; }
    const row = e.target.closest('.or2-row'); if (row && !mobile() && !e.target.closest('button, a')) openInfo(ORDERS.find((x) => x.id === +row.dataset.row));
  });

  render();

  // Состояния по адресу: ?detail=await|paid, ?dlg=confirm|reject, ?f=status|date, ?sheet=sort|filters|date, ?nf=1
  const first = ORDERS[0];
  if (params.get('detail') === 'await' && first) openInfo(first);
  if (params.get('detail') === 'paid') openInfo(ORDERS.find((o) => o.id === 131860));
  if (first && ['confirm', 'reject'].includes(params.get('dlg'))) openDlg(params.get('dlg'), first);
  if (params.get('f') === 'status') { const w = $('[data-key="status"]'); $('.or2-fbtn', w).click(); $$('input', w).forEach((i) => { i.checked = i.value === 'declined'; }); }
  if (params.get('f') === 'date') { pick = ['2026-10-05', '2026-10-14']; renderCal(dateDrop); dateDrop.hidden = false; $('[data-key="date"] .or2-fbtn').setAttribute('aria-expanded', 'true'); }
  if (params.get('sheet')) openSheet('sh-' + params.get('sheet'));
  if (params.has('nf')) { state.status = new Set(['declined']); state.range = ['2027-03-01', '2027-03-31']; render(); }
})();
