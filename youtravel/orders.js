// Раздел тревел-эксперта «Заявки на бронирование» v2: таблица как в ЛК, окно «Информация о бронировании», подтверждение и отказ, мобильные шторки.
// 21.10.2026 (#10 из Amiga): шесть фильтров текстом как «Туры» нового кабинета, мультивыбор «+N», даты как в ЛК (бронирование периодом, начало и завершение одним днём), сортировка списком из пунктов ЛК, строка «Всего / Найдено N заявок» и кнопка «Сбросить все фильтры (N)»
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
  const TOURS = {
    kam: ['Земля Камчатка. Вулканы, термальные источники', '2–9 ноября 2026', '2026-11-02', '2026-11-09'],
    bai: ['Байкальский лёд: Ольхон и Листвянка', '12–16 марта 2027', '2027-03-12', '2027-03-16'],
    dag: ['Дагестан: Сулакский каньон и древний Дербент', '14–19 ноября 2026', '2026-11-14', '2026-11-19'],
    alt: ['Алтай: Чуйский тракт и Мультинские озёра', '3–10 августа 2026', '2026-08-03', '2026-08-10'],
  };
  const T = (k) => Object.assign([...TOURS[k]], { key: k });
  const ORDERS = root.hasAttribute('data-empty') ? [] : [
    { id: 131925, at: '2026-10-14', name: 'Ольга', parts: ['женщина, 34 года', 'мужчина, 36 лет'], tour: T('kam'), st: 'pending', pay: 'none', price: 248000 },
    { id: 131917, at: '2026-10-13', name: 'Алексей', parts: ['мужчина, 29 лет'], tour: T('bai'), st: 'pending', pay: 'none', price: 96000 },
    { id: 131910, at: '2026-10-13', name: 'Игорь', parts: ['мужчина, 41 год', 'женщина, 39 лет', 'девочка, 12 лет', 'мальчик, 9 лет'], tour: T('kam'), st: 'pending', pay: 'none', price: 496000 },
    { id: 131860, at: '2026-10-09', name: 'Наталья', parts: ['женщина, 41 год', 'мужчина, 43 года'], tour: T('kam'), st: 'confirmed', pay: 'pre', price: 248000, full: 'Наталья Кузнецова', contacts: ['+7 912 345-67-89', 'natalia.k@mail.ru'] },
    { id: 131842, at: '2026-10-07', name: 'Ксения', parts: ['женщина, 27 лет'], tour: T('kam'), st: 'auto', pay: 'none', price: 124000 },
    { id: 131833, at: '2026-10-05', name: 'Антон', parts: ['мужчина, 31 год', 'женщина, 30 лет'], tour: T('kam'), st: 'declined', pay: 'none', price: 248000 },
    { id: 131788, at: '2026-10-03', name: 'Марина', parts: ['женщина, 38 лет', 'мужчина, 40 лет', 'женщина, 64 года'], tour: T('dag'), st: 'confirmed', pay: 'second', price: 237000, full: 'Марина Соколова', contacts: ['+7 903 555-12-40', 'marina.dag@yandex.ru'] },
    { id: 131701, at: '2026-07-02', name: 'Павел', parts: ['мужчина, 44 года', 'женщина, 42 года'], tour: T('alt'), st: 'finished', pay: 'second', price: 210000, full: 'Павел Егоров', contacts: ['+7 916 200-44-18', 'pavel.alt@mail.ru'] },
    { id: 131655, at: '2026-10-01', name: 'Елена', parts: ['женщина, 52 года'], tour: T('dag'), st: 'client', pay: 'pre', price: 79000 },
  ];
  const ST = { pending: 'Ожидает подтверждения', confirmed: 'Подтверждено', finished: 'Тур завершен', declined: 'Бронирование отклонено', client: 'Бронирование отменено клиентом', auto: 'Бронирование отменено автоматически.<br>Истек срок оплаты' };
  const ST_ORDER = ['pending', 'confirmed', 'finished', 'declined', 'client', 'auto'];
  const TOTAL = 'Всего 2&nbsp;280 заявок'; // в ЛК 57 страниц по 40; число условное, вопрос Руслану

  const ICON = { chat: '<img src="assets/or2-chat.svg" alt="" width="20" height="20">', profile: '<img src="assets/or2-profile.svg" alt="" width="20" height="20">' };
  const actions = (o) => {
    const chat = `<button class="or2-btn or2-btn--grey" type="button" data-toast="Чат с&nbsp;путешественником: не входит в прототип">${ICON.chat}Чат</button>`;
    if (o.st === 'pending') return chat + `<div class="or2-pair"><button class="or2-btn or2-btn--green" type="button" data-act="confirm" data-id="${o.id}">Подтвердить</button><button class="or2-btn or2-btn--white" type="button" data-act="reject" data-id="${o.id}">Отклонить</button></div>`;
    // #13 (Amiga, 21.10): у подтверждённых «Ссылка на вторую часть» (пока не внесена вторая часть) и «Выставить счёт на доп. услугу», подписи как в ЛК
    // #12 (21.10): «Контакты» в строке нет, как в действующем ЛК; контакты в окне деталей, туда ведёт номер заказа
    if (o.st === 'confirmed') return chat + extra(o);
    return chat;
  };
  const extra = (o) => (o.pay !== 'second' ? `<button class="or2-btn or2-btn--white" type="button" data-copy-link="${o.id}">Ссылка на&nbsp;вторую часть</button>` : '')
    + `<button class="or2-btn or2-btn--white" type="button" data-toast="Откроется чат с&nbsp;путешественником и&nbsp;сценарий выставления счёта на&nbsp;допуслугу">Выставить счёт на&nbsp;доп.&nbsp;услугу</button>`;

  // ---- Состояние фильтров и сортировки ----
  // списки: tour, status, pay (Set); даты: date [от, до], start и end (один день)
  const state = { tour: new Set(), status: new Set(), pay: new Set(), date: null, start: null, end: null, sort: 'new' };
  const LISTS = ['tour', 'status', 'pay'];
  const appliedCount = () => LISTS.filter((k) => state[k].size).length + ['date', 'start', 'end'].filter((k) => state[k]).length;
  const SORT = {
    new: ['Сначала новые', (a, b) => b.id - a.id], old: ['Сначала старые', (a, b) => a.id - b.id],
    name: ['По имени путешественника', (a, b) => a.name.localeCompare(b.name, 'ru')],
    count: ['По количеству путешественников', (a, b) => b.parts.length - a.parts.length || b.id - a.id],
    status: ['По статусу', (a, b) => ST_ORDER.indexOf(a.st) - ST_ORDER.indexOf(b.st) || b.id - a.id],
  };
  const visible = () => ORDERS.filter((o) => (!state.tour.size || state.tour.has(o.tour.key))
    && (!state.status.size || state.status.has(o.st))
    && (!state.pay.size || state.pay.has(o.pay))
    && (!state.date || (o.at >= state.date[0] && o.at <= state.date[1]))
    && (!state.start || o.tour[2] === state.start)
    && (!state.end || o.tour[3] === state.end))
    .sort(SORT[state.sort][1]);

  const num = (k) => k.split('-').reverse().join('.'); // 2026-11-02 → 02.11.2026, как в кнопке фильтра ЛК
  const rowsEl = $('#or2-rows'), tableEl = $('#or2-table'), nfEl = $('#or2-nf'), emptyEl = $('#or2-empty');
  const render = () => {
    if (!ORDERS.length) { tableEl.hidden = true; nfEl.hidden = true; emptyEl.hidden = false; $('#or2-filters').hidden = true; $('.or2-mfilters').hidden = true; $('.or2-result').hidden = true; return; }
    const list = visible();
    tableEl.hidden = !list.length; nfEl.hidden = !!list.length;
    rowsEl.innerHTML = list.map((o) => `
      <div class="or2-row" data-row="${o.id}">
        <div class="or2-cell or2-c--id"><button class="or2-id" type="button" data-act="info" data-id="${o.id}" aria-label="Детали заявки ${o.id}"><span class="m-only">Заказ&nbsp;</span>${o.id}<svg class="or2-id__arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M6.5 5L9.5 8L6.5 11" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg></button><p class="or2-sub">${dShort(o.at)}</p></div>
        <div class="or2-cell or2-c--trav"><p class="or2-main">${o.name}</p><p class="or2-sub">${people(o.parts.length)}</p></div>
        <div class="or2-cell or2-c--tour"><p class="or2-main or2-clamp">${o.tour[0]}</p><p class="or2-sub">${o.tour[1]}</p></div>
        <div class="or2-cell or2-c--st"><p class="or2-main or2-st--${o.st}">${ST[o.st]}</p></div>
        <div class="or2-cell or2-c--act">${actions(o)}</div>
      </div>`).join('');
    // фильтры-списки: название и «+N», даты: значение цифрами
    LISTS.forEach((k) => { const w = $(`[data-key="${k}"]`), n = state[k].size; $('.or2-flink', w).classList.toggle('is-applied', !!n); const m = $('[data-more]', w); m.textContent = '+' + n; m.hidden = !n; });
    const dl = { date: state.date && (state.date[0] === state.date[1] ? num(state.date[0]) : `${num(state.date[0])} – ${num(state.date[1])}`), start: state.start && num(state.start), end: state.end && num(state.end) };
    const dn = { date: 'Дата бронирования', start: 'Дата начала', end: 'Дата завершения' };
    Object.keys(dl).forEach((k) => { const w = $(`[data-key="${k}"]`); $('[data-label]', w).textContent = dl[k] || dn[k]; $('.or2-flink', w).classList.toggle('is-applied', !!dl[k]); });
    // строка результата и сброс
    const n = appliedCount();
    $('[data-found]').innerHTML = n ? `Найдено ${plural(list.length, ['заявка', 'заявки', 'заявок'])}` : TOTAL;
    $('#or2-freset').hidden = !n; $('[data-reset-label]').textContent = `Сбросить все фильтры (${n})`;
    $('[data-sort-label]').textContent = SORT[state.sort][0];
    $$('.or2-sortitem').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.sortby === state.sort)));
    // мобилка: счётчик на «Фильтры» и значения в шторке
    const sv = ['pending', 'confirmed', 'declined'].filter((k) => state.status.has(k)).map((k) => ({ confirmed: 'Подтверждено', pending: 'Ожидает подтверждения', declined: 'Отклонено' }[k]));
    $('[data-mcount]').textContent = n; $('[data-mcount]').hidden = !n;
    $('[data-sheet="filters"]').classList.toggle('is-applied', !!n);
    $('[data-status-v]').textContent = sv.length ? (sv.length === 1 ? sv[0] : sv.length) : 'Все';
    $('[data-date-v]').textContent = state.date ? rangeText(state.date, true) : 'Все';
  };
  const resetAll = () => { LISTS.forEach((k) => state[k].clear()); state.date = state.start = state.end = null; render(); };

  // ---- Панели фильтров (десктоп): одна открыта, клик мимо закрывает без применения ----
  const closeDrops = (except) => {
    $$('.or2-filter').forEach((w) => { if (w === except) return; $('.or2-drop', w).hidden = true; $('.or2-flink', w).setAttribute('aria-expanded', 'false'); });
    if (except !== 'sort') { $('.or2-sortlist').hidden = true; $('.or2-sortbtn').setAttribute('aria-expanded', 'false'); }
  };
  const syncChecks = (w) => { const k = w.dataset.key; $$('input[type=checkbox]', w).forEach((i) => { i.checked = state[k].has(i.value); }); };
  const filterTours = (w, q) => { const s = q.trim().toLowerCase(); let shown = 0; $$('.or2-check', w).forEach((l) => { const ok = !s || l.textContent.toLowerCase().includes(s); l.hidden = !ok; shown += ok; }); $('[data-nores]', w).hidden = !!shown; };
  const openDrop = (w) => {
    closeDrops(w); const drop = $('.or2-drop', w), btn = $('.or2-flink', w);
    drop.hidden = !drop.hidden; btn.setAttribute('aria-expanded', String(!drop.hidden)); if (drop.hidden) return;
    if (w.dataset.kind === 'list') { syncChecks(w); const s = $('[data-search]', w); if (s) { s.value = ''; filterTours(w, ''); } }
    else { const k = w.dataset.key; pick = state[k] ? (Array.isArray(state[k]) ? [...state[k]] : [state[k], state[k]]) : null; const v = pick ? pick[0] : null; calMonth = v ? [+v.slice(0, 4), +v.slice(5, 7) - 1] : [2026, 9]; renderCal(drop); }
  };
  $('#or2-filters').addEventListener('click', (e) => {
    const w = e.target.closest('.or2-filter'); if (!w) return;
    if (e.target.closest('.or2-flink')) return openDrop(w);
    const k = w.dataset.key;
    // «Очистить» снимает этот фильтр сразу и закрывает панель (решение 21.10: ✕ на фильтре нет)
    if (e.target.closest('[data-clear]')) { state[k].clear(); closeDrops(); render(); }
    if (e.target.closest('[data-apply]')) { state[k] = new Set($$('input[type=checkbox]:checked', w).map((i) => i.value)); closeDrops(); render(); }
  });
  $('#or2-filters').addEventListener('input', (e) => { if (e.target.matches('[data-search]')) filterTours(e.target.closest('.or2-filter'), e.target.value); });
  document.addEventListener('click', (e) => { if (!e.target.closest('.or2-filter, .or2-sort')) closeDrops(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrops(); });

  // ---- Сортировка (десктоп): список, применяется по клику ----
  $('.or2-sortbtn').addEventListener('click', () => { const l = $('.or2-sortlist'); closeDrops('sort'); l.hidden = !l.hidden; $('.or2-sortbtn').setAttribute('aria-expanded', String(!l.hidden)); });
  $('.or2-sortlist').addEventListener('click', (e) => { const b = e.target.closest('[data-sortby]'); if (!b) return; state.sort = b.dataset.sortby; closeDrops(); render(); });

  // ---- Календарь: «Дата бронирования» периодом, «Дата начала» и «Дата завершения» одним днём (как air-datepicker в ЛК) ----
  let calMonth = [2026, 9]; let pick = null;
  const iso = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  function rangeText([a, b], short) { const A = new Date(a), B = new Date(b); const same = A.getMonth() === B.getMonth(); return same ? `${A.getDate()}–${B.getDate()} ${ML[B.getMonth()]}${short ? '' : ' ' + B.getFullYear()}` : `${A.getDate()} ${ML[A.getMonth()]} – ${B.getDate()} ${ML[B.getMonth()]}`; }
  const TODAY = '2026-10-16';
  const calKey = (el) => el.dataset.cal || 'date';
  const renderCal = (el) => {
    const single = calKey(el) !== 'date';
    const [y, m] = calMonth; const first = (new Date(y, m, 1).getDay() + 6) % 7; const days = new Date(y, m + 1, 0).getDate(); const prevDays = new Date(y, m, 0).getDate();
    const cells = [];
    for (let i = first - 1; i >= 0; i--) cells.push([iso(y, m - 1, prevDays - i), prevDays - i, true]);
    for (let d = 1; d <= days; d++) cells.push([iso(y, m, d), d, false]);
    for (let d = 1; cells.length % 7; d++) cells.push([iso(y, m + 1, d), d, true]);
    const r = pick;
    const cls = ([k, , muted], i) => { const c = ['or2-day']; if (muted) c.push('is-muted'); if (k === TODAY) c.push('is-today'); const span = !single && r && r[1] && r[0] !== r[1]; if (r && r[0] && (k === r[0] || k === r[1])) { c.push('is-sel'); if (span) c.push(k === r[0] ? 'is-start' : 'is-end'); } else if (!single && r && r[1] && k > r[0] && k < r[1]) { c.push('is-in'); if (i % 7 === 0) c.push('is-row-start'); if (i % 7 === 6) c.push('is-row-end'); } return c.join(' '); };
    const title = `${['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'][m]} ${y}`;
    const chosen = !r || !r[0] ? 'нет' : single || !r[1] || r[0] === r[1] ? num(r[0]) : `${num(r[0])} – ${num(r[1])}`;
    el.innerHTML = `<div class="or2-cal__month"><button class="or2-cal__nav" type="button" data-nav="-1" aria-label="Предыдущий месяц"><img src="assets/or2-arrow-l.svg" alt="" width="20" height="20"></button>${title}<button class="or2-cal__nav" type="button" data-nav="1" aria-label="Следующий месяц"><img src="assets/or2-arrow-r.svg" alt="" width="20" height="20"></button></div>
      <div class="or2-cal__grid">${['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'].map((w, i) => `<span class="or2-cal__wd${i > 4 ? ' is-we' : ''}">${w}</span>`).join('')}${cells.map((c, i) => c[2] ? '<span class="or2-day is-empty" aria-hidden="true"></span>' : `<button class="${cls(c, i)}" type="button" data-day="${c[0]}"><span>${c[1]}</span></button>`).join('')}</div>
      <div class="or2-cal__range">Выбрано: <b>${chosen}</b></div>
      <div class="or2-drop__actions"><button class="or2-btn or2-btn--grey" type="button" data-cclear>Очистить</button><button class="or2-btn or2-btn--green" type="button" data-capply>Применить</button></div>`;
  };
  $$('[data-cal]').forEach((el) => el.addEventListener('click', (e) => {
    e.stopPropagation();
    const key = calKey(el), single = key !== 'date';
    const nav = e.target.closest('[data-nav]'); if (nav) { const [y, m] = calMonth; const d = new Date(y, m + +nav.dataset.nav, 1); calMonth = [d.getFullYear(), d.getMonth()]; return renderCal(el); }
    const day = e.target.closest('[data-day]'); if (day) { const k = day.dataset.day; pick = single ? [k, k] : !pick || pick[1] ? [k, null] : (k < pick[0] ? [k, pick[0]] : [pick[0], k]); return renderCal(el); }
    if (e.target.closest('[data-cclear]')) { pick = null; state[key] = null; closeDrops(); closeSheet('sh-date'); return render(); }
    if (e.target.closest('[data-capply]')) { if (pick && pick[0]) state[key] = single ? pick[0] : [pick[0], pick[1] || pick[0]]; pick = null; closeDrops(); closeSheet('sh-date'); render(); }
  }));

  // ---- Мобильные шторки ----
  const openSheet = (id) => { const s = document.getElementById(id); s.hidden = false; if (id === 'sh-filters') $$('[data-acc-body="status"] input', s).forEach((i) => { i.checked = state.status.has(i.value); }); if (id === 'sh-date') { mpick = state.date ? [...state.date] : null; renderMCal(); const m = $('[data-mcal]', s); requestAnimationFrame(() => { m.scrollTop = m.scrollHeight; }); } if (id === 'sh-sort') $$('.or2-sortopt', s).forEach((b) => b.setAttribute('aria-checked', String(b.dataset.sort === state.sort))); };
  const closeSheet = (id) => { const s = document.getElementById(id); if (s) s.hidden = true; };
  document.addEventListener('click', (e) => { const b = e.target.closest('[data-sheet]'); if (b) { if (b.dataset.sheet === 'date') closeSheet('sh-filters'); openSheet('sh-' + b.dataset.sheet); } });
  $('#sh-filters').addEventListener('click', (e) => {
    const acc = e.target.closest('[data-acc]'); if (acc) { const body = $(`[data-acc-body="${acc.dataset.acc}"]`); body.hidden = !body.hidden; acc.setAttribute('aria-expanded', String(!body.hidden)); }
    if (e.target.closest('[data-sclear]')) { $$('#sh-filters input').forEach((i) => { i.checked = false; }); resetAll(); }
    if (e.target.closest('[data-sapply]')) { state.status = new Set($$('#sh-filters input:checked').map((i) => i.value)); closeSheet('sh-filters'); render(); }
  });
  $('#sh-sort').addEventListener('click', (e) => { const o = e.target.closest('.or2-sortopt'); if (o) { state.sort = o.dataset.sort; $$('.or2-sortopt').forEach((b) => b.setAttribute('aria-checked', String(b === o))); render(); setTimeout(() => closeSheet('sh-sort'), 150); } });

  // ---- Мобильный календарь на весь экран (как «Когда?» на youtravel.me): месяцы списком, дни после сегодня недоступны ----
  let mpick = null;
  const MN = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  const renderMCal = () => {
    const r = mpick, span2 = r && r[1] && r[0] !== r[1];
    const month = (y, m) => {
      const first = (new Date(y, m, 1).getDay() + 6) % 7, days = new Date(y, m + 1, 0).getDate(); const cells = [];
      for (let i = 0; i < first; i++) cells.push(null);
      for (let d = 1; d <= days; d++) cells.push(d);
      return `<section class="or2-mmonth"><h3>${MN[m]} ${y}</h3><div class="or2-mgrid">${cells.map((d, i) => {
        if (d === null) return '<span class="or2-mday is-empty" aria-hidden="true"></span>';
        const k = iso(y, m, d), c = ['or2-mday'], col = i % 7;
        if (k > TODAY) c.push('is-dis');
        if (k === TODAY) c.push('is-today');
        if (r && r[0] && (k === r[0] || k === r[1])) { c.push('is-sel'); if (span2) c.push(k === r[0] ? 'is-start' : 'is-end'); }
        else if (span2 && k > r[0] && k < r[1]) { c.push('is-in'); if (col === 0 || d === 1) c.push('is-row-start'); if (col === 6 || d === days) c.push('is-row-end'); }
        return `<button class="${c.join(' ')}" type="button" data-mday="${k}"${k > TODAY ? ' disabled' : ''}><span>${d}</span></button>`;
      }).join('')}</div></section>`;
    };
    $('[data-mcal]').innerHTML = month(2026, 7) + month(2026, 8) + month(2026, 9);
    $('[data-mchosen]').textContent = !r || !r[0] ? 'нет' : !r[1] || r[0] === r[1] ? num(r[0]) : `${num(r[0])} – ${num(r[1])}`;
  };
  $('#sh-date').addEventListener('click', (e) => {
    const d = e.target.closest('[data-mday]');
    if (d) { const k = d.dataset.mday, m = $('[data-mcal]'), top = m.scrollTop; mpick = !mpick || mpick[1] ? [k, null] : (k < mpick[0] ? [k, mpick[0]] : [mpick[0], k]); renderMCal(); m.scrollTop = top; return; }
    if (e.target.closest('[data-back]')) { closeSheet('sh-date'); openSheet('sh-filters'); return; }
    if (e.target.closest('[data-mclear]')) { mpick = null; state.date = null; closeSheet('sh-date'); render(); return; }
    if (e.target.closest('[data-mapply]')) { if (mpick && mpick[0]) state.date = [mpick[0], mpick[1] || mpick[0]]; closeSheet('sh-date'); render(); }
  });

  $$('#or2-reset, #or2-freset').forEach((b) => b.addEventListener('click', resetAll));

  // ---- Тост ----
  const toast = document.createElement('div'); toast.className = 'toast'; toast.setAttribute('role', 'status'); document.body.append(toast);
  let tt; const say = (h) => { toast.innerHTML = h; toast.classList.add('is-on'); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('is-on'), 2400); };
  document.addEventListener('click', (e) => { const t = e.target.closest('[data-toast]'); if (t) { e.preventDefault(); e.stopPropagation(); say(t.dataset.toast); } }, true);

  // ---- Окно «Информация о бронировании» ----
  const info = $('#or2-info'); let current = null;
  const fill = (o) => {
    current = o; const half = Math.round(o.price / 2);
    const preOk = o.pay !== 'none', postOk = o.pay === 'second';
    // контакты как в живом ЛК (22.10.2026): до предоплаты только имя и плашка над кнопками; после предоплаты имя с фамилией, телефон и email, в конце «Путешественники»
    const open = !!(o.contacts && preOk);
    const f = [
      ['Номер заказа', o.id], ['Имя клиента', open ? [o.full, ...o.contacts].join('\n') : o.name], ['Название тура', `<a href="#" data-toast="Страница тура: не входит в прототип">${o.tour[0]}</a>`], ['Забронированные даты', o.tour[1]],
      ['Количество путешественников', o.parts.length], ['Данные участников', o.parts.map((p, i) => `Участник ${i + 1}: ${p}`).join('\n')],
      ['Статус заказа', `<span class="or2-st--${o.st}">${ST[o.st]}</span>`], ['Цена тура', rub(o.price)],
      ['Размер предоплаты', `${rub(half)}<span class="or2-sub${preOk ? ' is-paid' : ''}">${preOk ? 'Оплачена' : 'Не оплачена'}</span>`],
      ['Размер постоплаты', `${rub(o.price - half)}<span class="or2-sub${postOk ? ' is-paid' : ''}">${postOk ? 'Оплачена' : 'Не оплачена'}</span>`],
      ['Списанный<br class="d-only">автоматически долг', '0 ₽'],
    ];
    if (open) f.push(['Путешественники', `<span class="or2-trav"><b>Основной путешественник:</b><span><a href="#" data-toast="Профиль путешественника: не входит в прототип">${o.full}</a>\n${o.contacts[1]}\n${o.contacts[0]}</span></span>`]);
    $('#or2-note').hidden = o.st !== 'pending';
    $('#or2-fields').innerHTML = f.map(([k, v]) => `<div class="or2-field"><dt>${k}</dt><dd>${v}</dd></div>`).join('');
    const chat = `<button class="or2-btn ${mobile() ? 'or2-btn--white' : 'or2-btn--grey'}" type="button" data-toast="Чат с&nbsp;путешественником: не входит в прототип">${ICON.chat}Перейти в&nbsp;чат</button>`;
    $('#or2-info-actions').innerHTML = o.st === 'pending'
      ? (mobile() ? `<button class="or2-btn or2-btn--green" type="button" data-act="confirm" data-id="${o.id}">Подтвердить</button><button class="or2-btn or2-btn--white" type="button" data-act="reject" data-id="${o.id}">Отклонить</button>${chat}`
        : `${chat}<button class="or2-btn or2-btn--white" type="button" data-act="reject" data-id="${o.id}">Отклонить</button><button class="or2-btn or2-btn--green" type="button" data-act="confirm" data-id="${o.id}">Подтвердить</button>`)
      : o.st === 'confirmed' ? extra(o) + chat : chat;
    $('#or2-info-actions').classList.toggle('is-stack', o.st === 'confirmed');
  };
  const openInfo = (o) => { fill(o); info.hidden = false; };

  // ---- Подтверждение и отказ ----
  const dlgC = $('#dlg-confirm'), dlgR = $('#dlg-reject');
  const summary = (o) => `<p><b>Заказ ${o.id}</b> · <b>${o.name}</b>, ${people(o.parts.length)}</p><p>${o.tour[0].split('.')[0]}, <b>${o.tour[1]}</b></p><p>${rub(o.price)}</p>`;
  const MG = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  const span = (o) => { const a = new Date(o.tour[2]), b = new Date(o.tour[3]); return a.getMonth() === b.getMonth() ? `со&nbsp;${a.getDate()} по&nbsp;${b.getDate()} ${MG[b.getMonth()]} ${b.getFullYear()}` : `с&nbsp;${a.getDate()} ${MG[a.getMonth()]} по&nbsp;${b.getDate()} ${MG[b.getMonth()]} ${b.getFullYear()}`; };
  const rejSummary = (o) => `<p class="or2-rej__l">Заказ ${o.id} · ${o.name}, ${people(o.parts.length)}</p><p class="or2-rej__s">${o.tour[0].split('.')[0]}, ${span(o)}</p><p class="or2-rej__l">${rub(o.price)}</p>`;
  const rejReason = $('#rej-reason'), rejText = $('#rej-text'), rejOk = $('#dlg-reject-ok');
  const rejReset = () => { rejReason.value = ''; rejText.value = ''; $('[data-count]', dlgR).textContent = '0/500'; rejOk.disabled = true; rejReason.closest('.or2-select').classList.remove('is-set'); };
  rejReason.addEventListener('change', () => { rejOk.disabled = !rejReason.value; rejReason.closest('.or2-select').classList.add('is-set'); });
  rejText.addEventListener('input', () => { $('[data-count]', dlgR).textContent = `${rejText.value.length}/500`; });
  const openDlg = (kind, o) => { current = o; if (kind === 'confirm') { $('[data-order-summary]', dlgC).innerHTML = summary(o); dlgC.hidden = false; } else { $('[data-reject-summary]', dlgR).innerHTML = rejSummary(o); rejReset(); dlgR.hidden = false; } };
  const decide = (st, msg) => { if (!current) return; current.st = st; dlgC.hidden = dlgR.hidden = true; render(); if (!info.hidden) fill(current); say(msg); };
  $('#dlg-confirm-ok').addEventListener('click', () => decide('confirmed', 'Бронирование подтверждено'));
  $('#dlg-reject-ok').addEventListener('click', () => decide('declined', 'Бронирование отклонено'));

  // «Ссылка на вторую часть»: ссылка в буфер и сообщение, как описал Владимир в треде #13
  document.addEventListener('click', (e) => {
    const c = e.target.closest('[data-copy-link]'); if (!c) return;
    const url = `https://youtravel.me/pay/${c.dataset.copyLink}/second`;
    (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).catch(() => {}).finally(() => say('Ссылка на&nbsp;оплату второй части скопирована'));
  });

  // клики по строкам и кнопкам
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-act][data-id]');
    if (a) { const o = ORDERS.find((x) => x.id === +a.dataset.id); if (a.dataset.act === 'info') openInfo(o); else openDlg(a.dataset.act, o); return; }
  });

  render();

  // Состояния по адресу: ?detail=await|paid, ?dlg=confirm|reject, ?f=tour|status|date|sort (&q= для поиска туров), ?sheet=sort|filters|date, ?fa=1|all, ?nf=1
  const first = ORDERS[0];
  const openF = (k) => openDrop($(`[data-key="${k}"]`));
  if (params.get('detail') === 'await' && first) openInfo(first);
  if (params.get('detail') === 'paid') openInfo(ORDERS.find((o) => o.id === 131860));
  if (first && ['confirm', 'reject'].includes(params.get('dlg'))) openDlg(params.get('dlg'), first);
  if (params.get('sheet')) { openSheet('sh-' + params.get('sheet')); if (params.get('sheet') === 'date') { mpick = ['2026-10-05', '2026-10-14']; renderMCal(); } }
  if (params.has('nf')) { state.status = new Set(['declined']); state.start = '2027-03-10'; render(); }
  if (params.get('fa') === '1') { state.tour = new Set(['kam']); state.status = new Set(['pending', 'confirmed']); state.start = '2026-11-02'; render(); }
  if (params.get('fa') === 'all') { state.tour = new Set(['kam', 'bai']); state.status = new Set(['pending', 'confirmed']); state.pay = new Set(['none', 'pre']); state.date = ['2026-10-01', '2026-10-31']; state.start = '2026-11-02'; state.end = '2026-11-09'; render(); }
  if (params.get('f') === 'tour') { openF('tour'); const w = $('[data-key="tour"]'); $$('input[type=checkbox]', w).forEach((i) => { i.checked = ['kam', 'dag'].includes(i.value); }); if (params.get('q')) { $('[data-search]', w).value = params.get('q'); filterTours(w, params.get('q')); } }
  if (params.get('f') === 'status') { openF('status'); $$('[data-key="status"] input').forEach((i) => { i.checked = ['pending', 'declined'].includes(i.value); }); }
  if (params.get('f') === 'date') { openF('date'); pick = ['2026-10-05', '2026-10-14']; renderCal($('[data-key="date"] .or2-drop')); }
  if (params.get('f') === 'sort') $('.or2-sortbtn').click();
})();
