// Раздел тревел-эксперта «Заявки на бронирование»: данные, вкладки, фильтры, сортировка, окна подтверждения и отказа, боковая панель
(() => {
  const root = document.getElementById('orders');
  if (!root) return;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const params = new URLSearchParams(location.search);

  const plural = (n, [one, few, many]) => {
    const m10 = n % 10, m100 = n % 100;
    return n + ' ' + (m10 === 1 && m100 !== 11 ? one : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? few : many);
  };
  const reqs = (n) => plural(n, ['заявка', 'заявки', 'заявок']);
  const people = (n) => plural(n, ['участник', 'участника', 'участников']);
  const years = (n) => plural(n, ['год', 'года', 'лет']);
  const rub = (n) => n.toLocaleString('ru-RU').replace(/\s/g, ' ') + ' ₽';
  const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  const MSHORT = ['янв.', 'февр.', 'марта', 'апр.', 'мая', 'июня', 'июля', 'авг.', 'сент.', 'окт.', 'нояб.', 'дек.'];
  const dShort = (iso) => { const d = new Date(iso); return `${d.getDate()} ${MSHORT[d.getMonth()]}`; };
  const dLong = (iso) => { const d = new Date(iso); return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; };

  // ---- Данные: заезды и заявки (тексты первого заезда как в макете) ----
  const DEPS = [
    { id: 'kam', title: 'Земля Камчатка. Вулканы, термальные источники', short: 'Земля Камчатка', filter: 'Земля Камчатка', dates: 'со 2 по 9 ноября 2026', start: '2026-11', end: '2026-11', seats: [6, 12] },
    { id: 'dag', title: 'Дагестан: Сулакский каньон и древний Дербент', short: 'Дагестан', filter: 'Дагестан: Сулакский каньон', dates: 'с 14 по 19 ноября 2026', start: '2026-11', end: '2026-11', seats: [9, 12] },
    { id: 'bai', title: 'Байкальский лёд: Ольхон и Листвянка', short: 'Байкальский лёд', filter: 'Байкальский лёд', dates: 'с 12 по 16 марта 2027', start: '2027-03', end: '2027-03', seats: [7, 10] },
    { id: 'alt', title: 'Алтай: Чуйский тракт и Мультинские озёра', short: 'Алтай', filter: 'Алтай: Чуйский тракт', dates: 'с 3 по 10 августа 2027', start: '2027-08', end: '2027-08', seats: [8, 10] },
  ];
  // pay: none | pre | full; status: pending | confirmed | prepaid | paid | rejected | cancelled
  const ORDERS = root.hasAttribute('data-empty') ? [] : [
    { id: 131925, dep: 'kam', at: '2026-10-14T11:20', name: 'Ольга', group: [['Ольга', 34], ['Игорь', 36]], sum: 248000, extra: [['Трансфер из аэропорта', 12000]], pay: 'none', status: 'pending' },
    { id: 131910, dep: 'kam', at: '2026-10-13T19:05', name: 'Игорь', group: [['Игорь', 41], ['Марина', 39], ['Соня', 12], ['Миша', 9]], sum: 496000, pay: 'none', status: 'pending' },
    { id: 131917, dep: 'bai', at: '2026-10-13T10:40', name: 'Алексей', group: [['Алексей', 29]], sum: 96000, pay: 'pre', paid: 30000, status: 'pending' },
    { id: 131860, dep: 'kam', at: '2026-10-06T15:00', name: 'Наталья', group: [['Наталья', 45], ['Сергей', 47]], sum: 248000, pay: 'pre', paid: 75000, status: 'prepaid' },
    { id: 131842, dep: 'kam', at: '2026-10-02T09:30', name: 'Ксения', group: [['Ксения', 27]], sum: 124000, pay: 'none', status: 'cancelled' },
    { id: 131833, dep: 'kam', at: '2026-09-30T18:10', name: 'Антон', group: [['Антон', 31], ['Вера', 30]], sum: 248000, pay: 'none', status: 'rejected' },
    { id: 131890, dep: 'dag', at: '2026-10-09T12:00', name: 'Мария', group: [['Мария', 38], ['Олег', 40]], sum: 158000, pay: 'full', status: 'paid' },
    { id: 131871, dep: 'dag', at: '2026-10-07T16:45', name: 'Дмитрий', group: [['Дмитрий', 33]], sum: 79000, pay: 'pre', paid: 20000, status: 'prepaid' },
    { id: 131855, dep: 'dag', at: '2026-10-05T08:15', name: 'Елена', group: [['Елена', 52], ['Пётр', 55], ['Аня', 24]], sum: 237000, pay: 'none', status: 'confirmed' },
    { id: 131880, dep: 'bai', at: '2026-10-08T13:30', name: 'Светлана', group: [['Светлана', 36], ['Илья', 37]], sum: 192000, pay: 'full', status: 'paid' },
    { id: 131901, dep: 'alt', at: '2026-10-11T20:00', name: 'Павел', group: [['Павел', 44], ['Ирина', 42]], sum: 210000, pay: 'pre', paid: 60000, status: 'prepaid' },
  ];
  const STATUS = { pending: 'Ожидает подтверждения', confirmed: 'Подтверждено', prepaid: 'Предоплачен', paid: 'Оплачен', rejected: 'Отклонено', cancelled: 'Отменено автоматически.<br>Истек срок оплаты' };
  const STATUS_PLAIN = { ...STATUS, cancelled: 'Отменено автоматически' };
  const PAY = { none: 'Не оплачено', pre: 'Предоплата', full: 'Оплачено' };
  const payText = (o) => o.pay === 'pre' ? `Предоплата ${rub(o.paid)}` : PAY[o.pay];
  const paidSum = (o) => o.pay === 'full' ? o.sum : o.pay === 'pre' ? o.paid : 0;
  const dep = (o) => DEPS.find((d) => d.id === o.dep);

  // ---- Фильтры ----
  const MONTH_NAME = (ym) => { const [y, m] = ym.split('-'); const n = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'][+m - 1]; return `${n} ${y}`; };
  const FILTERS = [
    { key: 'tour', label: 'Название тура', all: 'Все туры', opts: DEPS.map((d) => [d.id, d.filter]), test: (o, v) => o.dep === v },
    { key: 'status', label: 'Статус бронирования', all: 'Любой статус', opts: Object.keys(STATUS).map((k) => [k, STATUS_PLAIN[k]]), test: (o, v) => o.status === v },
    { key: 'pay', label: 'Статус оплаты', all: 'Любой', opts: Object.entries(PAY), test: (o, v) => o.pay === v },
    { key: 'booked', label: 'Дата бронирования', all: 'Любая дата', opts: [['2026-10', 'Октябрь 2026'], ['2026-09', 'Сентябрь 2026']], test: (o, v) => o.at.startsWith(v) },
    { key: 'start', label: 'Дата начала', all: 'Любая дата', opts: ['2026-11', '2027-01', '2027-03', '2027-08'].map((m) => [m, MONTH_NAME(m)]), test: (o, v) => dep(o).start === v },
    { key: 'end', label: 'Дата завершения', all: 'Любая дата', opts: ['2026-11', '2027-03', '2027-08'].map((m) => [m, MONTH_NAME(m)]), test: (o, v) => dep(o).end === v },
    { key: 'sort', label: 'Сортировка', opts: [['near', 'Ближайшие заезды'], ['new', 'Сначала новые заявки'], ['sum', 'По сумме']] },
  ];
  const state = { tab: 'all', f: {}, sort: 'near', open: new Set(['kam']) };
  if (params.has('nf')) { state.f.tour = 'alt'; state.f.start = '2027-01'; }

  const CHEV = '<img src="assets/or-chev-down.svg" alt="" width="24" height="24">';
  const filtersEl = $('#or-filters');
  const FILTER_ICON = '<img src="assets/or-filter.svg" alt="" width="16.2" height="12">';
  const renderFilters = () => {
    const n = Object.keys(state.f).length;
    // на мобилке шесть фильтров спрятаны под кнопкой «Фильтры», рядом остаётся «Сортировка»
    filtersEl.innerHTML = `<div class="or-filter or-filter--toggle m-only"><button class="button button--outline or-filter__btn" type="button" aria-expanded="${filtersEl.classList.contains('is-open')}"><span class="or-filter__icon">${FILTER_ICON}</span>Фильтры${n ? ' · ' + n : ''}</button></div>` + FILTERS.map((f) => {
      const val = f.key === 'sort' ? null : state.f[f.key];
      const cur = f.key === 'sort' ? state.sort : val;
      const label = val ? f.opts.find(([k]) => k === val)[1] : f.label;
      const items = (f.all ? [['', f.all]] : []).concat(f.opts)
        .map(([k, t]) => `<li><button type="button" role="menuitemradio" data-v="${k}" aria-checked="${(cur || '') === k}">${t}</button></li>`).join('');
      return `<div class="or-filter${f.key === 'sort' ? ' or-filter--sort' : ''}" data-key="${f.key}"><button class="button button--outline or-filter__btn" type="button" aria-haspopup="true" aria-expanded="false">${label}${CHEV}</button><ul class="or-menu" role="menu" hidden>${items}</ul></div>`;
    }).join('');
  };
  const closeMenus = (except) => $$('.or-filter[data-key]', filtersEl).forEach((w) => {
    if (w === except) return;
    $('.or-menu', w).hidden = true;
    $('.or-filter__btn', w).setAttribute('aria-expanded', 'false');
  });
  filtersEl.addEventListener('click', (e) => {
    const w = e.target.closest('.or-filter');
    if (!w) return;
    if (w.classList.contains('or-filter--toggle')) {
      const open = filtersEl.classList.toggle('is-open');
      $('.or-filter__btn', w).setAttribute('aria-expanded', String(open));
      closeMenus();
      return;
    }
    const opt = e.target.closest('.or-menu button');
    if (opt) {
      const key = w.dataset.key, v = opt.dataset.v;
      if (key === 'sort') state.sort = v; else if (v) state.f[key] = v; else delete state.f[key];
      renderFilters();
      render();
      return;
    }
    const menu = $('.or-menu', w), btn = $('.or-filter__btn', w);
    closeMenus(w);
    menu.hidden = !menu.hidden;
    btn.setAttribute('aria-expanded', String(!menu.hidden));
  });
  document.addEventListener('click', (e) => { if (!e.target.closest('.or-filter')) closeMenus(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenus(); });

  // ---- Вкладки ----
  const TAB_TEST = { all: () => true, pending: (o) => o.status === 'pending', confirmed: (o) => o.status === 'confirmed', prepaid: (o) => o.status === 'prepaid', paid: (o) => o.status === 'paid' };
  $$('.or-tab', root).forEach((t) => t.addEventListener('click', () => {
    state.tab = t.dataset.tab;
    $$('.or-tab', root).forEach((x) => x.setAttribute('aria-selected', String(x === t)));
    render();
  }));

  // ---- Сборка списка ----
  const statsEl = $('#or-stats'), pendEl = $('#or-pending'), depsEl = $('#or-deps'), nfEl = $('#or-nf');
  const visible = () => ORDERS.filter((o) => TAB_TEST[state.tab](o) && FILTERS.every((f) => !f.test || !state.f[f.key] || f.test(o, state.f[f.key])));
  const filtered = () => state.tab !== 'all' || Object.keys(state.f).length > 0;
  const newest = (a, b) => b.at.localeCompare(a.at);

  const btnsPending = (o) => `<div class="or-actions">
          <button class="button button--green button--s" type="button" data-act="confirm" data-id="${o.id}">Подтвердить</button>
          <div class="or-actions__row"><button class="button button--grey button--s" type="button" data-act="reject" data-id="${o.id}">Отклонить</button><button class="button button--outline button--s" type="button" data-act="more" data-id="${o.id}">Подробнее</button></div>
        </div>`;
  const btnMore = (o) => `<div class="or-actions or-actions--single"><button class="button button--outline button--s" type="button" data-act="more" data-id="${o.id}">Подробнее</button></div>`;

  const render = () => {
    if (!statsEl) return;
    const list = visible();
    const pendAll = ORDERS.filter((o) => o.status === 'pending');
    const none = list.length === 0;
    nfEl.hidden = !none;
    statsEl.hidden = pendEl.hidden = depsEl.hidden = none;
    if (none) return;

    statsEl.innerHTML = `
      <div class="or-stat"><p class="or-meta"><span class="d-only">Ожидают подтверждения</span><span class="m-only">Ждут подтверждения</span></p><p class="or-stat__value">${reqs(pendAll.length)}</p></div>
      <div class="or-stat"><p class="or-meta">Ожидают оплаты</p><p class="or-stat__value">${reqs(ORDERS.filter((o) => o.status === 'confirmed').length)}</p></div>
      <div class="or-stat or-stat--near"><p class="or-meta">Ближайший заезд</p><p class="or-stat__value">${DEPS[0].dates}</p><p class="or-stat__sub">${DEPS[0].short}</p></div>`;

    const pend = list.filter((o) => o.status === 'pending').sort(newest);
    pendEl.hidden = pend.length === 0;
    pendEl.innerHTML = `<h2 class="or-section-head">Ожидают подтверждения <span>${pend.length}</span></h2>` + pend.map((o) => `
      <div class="or-req" data-row="${o.id}">
        <div class="or-req__info">
          <p class="or-meta">Заказ ${o.id} · ${dShort(o.at)}</p>
          <p class="or-req__who"><span class="or-name">${o.name}</span><span class="or-meta">${people(o.group.length)}</span></p>
          <p class="or-req__trip d-only"><b>${dep(o).dates}</b> · ${dep(o).title}</p>
          <p class="or-name m-only">${dep(o).dates}</p>
          <p class="or-req__tour m-only">${dep(o).title}</p>
        </div>
        <div class="or-req__sum"><p class="or-amount">${rub(o.sum)}</p><p class="or-pay">${payText(o)}</p></div>
        ${btnsPending(o)}
      </div>`).join('');

    // заезды: порядок по выбранной сортировке, внутри заезда сначала новые заявки
    const groups = DEPS.map((d) => ({ d, rows: list.filter((o) => o.dep === d.id).sort(newest) })).filter((g) => g.rows.length);
    const key = { near: (g) => g.d.start, new: (g) => g.rows[0].at, sum: (g) => g.rows.reduce((s, o) => s + o.sum, 0) };
    groups.sort((a, b) => state.sort === 'near' ? key.near(a).localeCompare(key.near(b)) : state.sort === 'new' ? key.new(b).localeCompare(key.new(a)) : key.sum(b) - key.sum(a));
    const showAll = filtered();
    depsEl.innerHTML = `<div class="or-deps__head"><h2>Все заезды</h2><button class="or-archive" type="button" data-toast="Архив заявок: вне тестового">Архив · 12</button></div>` + groups.map(({ d, rows }) => {
      const open = showAll || state.open.has(d.id);
      return `
      <button class="or-dep" type="button" data-dep="${d.id}" aria-expanded="${open}" aria-controls="or-rows-${d.id}">
        <span class="or-dep__title"><span>${d.title}</span><span class="or-meta">${d.dates}</span></span>
        <span class="or-dep__slot" aria-hidden="true"><img class="m-only" src="assets/or-chev-down.svg" alt="" width="24" height="24"></span>
        <span class="or-occ"><span>Занято ${d.seats[0]} из ${d.seats[1]} мест</span><span class="or-occ__bar"><span style="width:${Math.round(d.seats[0] / d.seats[1] * 160)}px;--occ:${(d.seats[0] / d.seats[1]).toFixed(3)}"></span></span></span>
        <span class="or-meta or-dep__count">${reqs(rows.length)}${(() => { const w = rows.filter((o) => o.status === 'pending').length; return w ? `<span class="m-only">, ${w} ${w === 1 ? 'ждёт' : 'ждут'}</span>` : ''; })()}</span>
      </button>
      <div class="or-rows" id="or-rows-${d.id}"${open ? '' : ' hidden'}>` + rows.map((o) => `
        <div class="or-row" data-row="${o.id}">
          <div class="or-row__id"><p>${o.id}</p></div>
          <div class="or-row__who"><p>${o.name}</p><p class="or-meta">${people(o.group.length)}</p></div>
          <div class="or-row__sum"><p>${rub(o.sum)}</p><p class="or-pay">${payText(o)}</p></div>
          <div class="or-row__status"><p class="or-status--${o.status}">${STATUS[o.status]}</p></div>
          ${o.status === 'pending' ? btnsPending(o) : btnMore(o)}
          <button class="or-row__m m-only" type="button" data-act="more" data-id="${o.id}"><span><b>${o.id} · ${o.name}, ${people(o.group.length)}</b><span>${rub(o.sum)}</span><span class="or-status--${o.status}">${STATUS[o.status]}</span></span><img src="assets/or-chev-down.svg" alt="" width="24" height="24"></button>
        </div>`).join('') + '</div>';
    }).join('');
  };

  depsEl?.addEventListener('click', (e) => {
    const h = e.target.closest('.or-dep');
    if (!h) return;
    const id = h.dataset.dep, rows = $(`#or-rows-${id}`);
    const open = rows.hidden;
    rows.hidden = !open;
    h.setAttribute('aria-expanded', String(open));
    if (open) state.open.add(id); else state.open.delete(id);
  });

  $('#or-reset')?.addEventListener('click', () => {
    state.f = {};
    state.tab = 'all';
    $$('.or-tab', root).forEach((x) => x.setAttribute('aria-selected', String(x.dataset.tab === 'all')));
    renderFilters();
    render();
  });

  // ---- Тост ----
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'status');
  document.body.append(toast);
  let toastTimer;
  const say = (html) => {
    toast.innerHTML = html;
    toast.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-on'), 2400);
  };
  document.addEventListener('click', (e) => { const t = e.target.closest('[data-toast]'); if (t) { e.preventDefault(); say(t.dataset.toast); } });

  // ---- Окна подтверждения и отказа ----
  const dlgC = $('#dlg-confirm'), dlgR = $('#dlg-reject'), reason = $('#dlg-reject-reason');
  let current = null;
  const summary = (o) => `<p><b>Заказ ${o.id}</b> · <b>${o.name}</b>, ${people(o.group.length)}</p><p>${dep(o).short}, <b>${dep(o).dates}</b></p><p>${rub(o.sum)}</p>`;
  const openDlg = (kind, o, quiet) => {
    current = o;
    const d = kind === 'confirm' ? dlgC : dlgR;
    $('[data-order-summary]', d).innerHTML = summary(o);
    if (kind === 'reject') reason.value = '';
    d.hidden = false;
    if (!quiet) $(kind === 'confirm' ? '#dlg-confirm-ok' : '#dlg-reject-reason').focus({ focusVisible: false });
  };
  const decide = (status, msg) => {
    if (!current) return;
    current.status = status;
    if (status === 'rejected') current.reason = reason.value.trim();
    dlgC.hidden = dlgR.hidden = true;
    render();
    if (!drawer.hidden) fillDrawer(current);
    say(msg);
  };
  $('#dlg-confirm-ok')?.addEventListener('click', () => decide('confirmed', 'Бронирование подтверждено'));
  $('#dlg-reject-ok')?.addEventListener('click', () => decide('rejected', 'Бронирование отклонено'));

  // ---- Боковая панель ----
  const drawer = $('#or-drawer');
  const fillDrawer = (o) => {
    current = o;
    const d = dep(o);
    $('#or-drawer-title').textContent = `Заказ ${o.id}`;
    $('#or-drawer-sub').textContent = `от ${dLong(o.at)} · ${STATUS_PLAIN[o.status]}`;
    $('#or-drawer-tour').textContent = d.title;
    $('#or-drawer-dates').textContent = d.dates;
    $('#or-drawer-people').innerHTML = o.group.map(([n, a]) => `<div class="or-line"><span>${n}</span><b>${years(a)}</b></div>`).join('');
    const extra = o.extra || [];
    const tour = o.sum - extra.reduce((s, [, v]) => s + v, 0);
    $('#or-drawer-cost').innerHTML = [[`Тур, ${people(o.group.length)}`, tour], ...extra, ['Итого', o.sum], ['Оплачено', paidSum(o)]]
      .map(([t, v]) => `<div class="or-line"><span>${t}</span><b>${rub(v)}</b></div>`).join('');
    $('#or-drawer-decision').hidden = o.status !== 'pending';
  };
  const openDrawer = (o, quiet) => {
    fillDrawer(o);
    drawer.hidden = false;
    document.body.classList.add('or-lock');
    if (!quiet) $('.or-close', drawer).focus({ focusVisible: false });
  };
  const closeDrawer = () => { drawer.hidden = true; document.body.classList.remove('or-lock'); };
  drawer?.addEventListener('click', (e) => {
    if (e.target.closest('[data-drawer-close]')) return closeDrawer();
    const a = e.target.closest('[data-act]');
    if (a && current) openDlg(a.dataset.act, current);
  });
  // Esc: сначала закрывается окно поверх панели (его закрывает app.js), панель только следующим нажатием
  let dialogWasOpen = false;
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') dialogWasOpen = !dlgC.hidden || !dlgR.hidden; }, true);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && drawer && !drawer.hidden && !dialogWasOpen) closeDrawer(); });

  // Действия в строках
  root.addEventListener('click', (e) => {
    const a = e.target.closest('[data-act][data-id]');
    if (!a) return;
    const o = ORDERS.find((x) => x.id === +a.dataset.id);
    if (a.dataset.act === 'more') openDrawer(o); else openDlg(a.dataset.act, o);
  });

  renderFilters();
  render();

  // Состояния по адресу: ?dlg=confirm|reject, ?drawer=1, ?nf=1
  const first = ORDERS.find((o) => o.status === 'pending');
  const dlg = params.get('dlg');
  if (first && (dlg === 'confirm' || dlg === 'reject')) openDlg(dlg, first, true);
  if (ORDERS[0] && params.has('drawer')) openDrawer(ORDERS[0], true);
})();
