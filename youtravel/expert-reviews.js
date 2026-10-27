// Раздел тревел-эксперта «Отзывы» (десктоп): список, пусто, загрузка, фильтр по туру с поиском, сортировка, подсказка у рейтинга,
// форма ответа в строке, отправка, ошибка отправки, ответ отправлен, редактирование «(Ред.)» 2 часа, «Показать ещё» по 10.
// Кадры Figma «ТЭ · Desktop» (12370:151806). Состояния открываются адресом: ?s=empty|loading, ?tip=rating, ?sort=1, ?f=tour[&q=…], ?tour=1,
// ?reply=1|org, ?send=1, ?fail=1, ?sent=1, ?edit=1, ?locked=1. Тексты строк дословно из кадров (в LKTE они разные на разных кадрах).
(() => {
  const root = document.getElementById('er');
  if (!root) return;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const P = new URLSearchParams(location.search);

  // Неразрывный пробел после коротких слов (до трёх букв)
  const nb = (s) => s.replace(/(^|[\s («])([А-Яа-яЁёA-Za-z]{1,3}) /g, '$1$2 ').replace(/(^|[\s («])([А-Яа-яЁёA-Za-z]{1,3}) /g, '$1$2 ');
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const tx = (s) => esc(nb(s));
  // Текст путешественника: на десктопе как написал автор (кадры «ТЭ · Desktop»), на мобилке с неразрывными пробелами, как в кадре «ТЭ · Mobile / Отзывы / Список»
  const MOB = matchMedia('(max-width: 640px)');
  const ut = (s) => esc(MOB.matches ? nb(s) : s);

  // ---- Тексты кадров ----
  const T3 = 'Спасибо за очередной офигеннай кэмп! Все было очень и очень круто! Я в восторге и не перестану рекомендовать зимний отдых только с ними! Горы, солнце, эмоции, конкурсы, каталка, снег, вжух, синие коленки, фотки, каталка, каталка и ещё раз каталка...! Восхитительная неделя, 100% перезагрузка. спасибо...';
  const T3_FULL = T3.replace(/спасибо\.\.\.$/, 'спасибо организаторам за заботу и компанию! Обязательно поеду ещё раз.');
  const T2 = 'Спасибо за очередной офигеннай кэмп! Все было очень и очень круто! Я в восторге и не перестану рекомендовать зимний отдых только с ними! Горы, солнце, эмоции, конкурсы, каталка, снег, в...';
  const T19 = 'Спасибо за очередной офигеннай кэмп! Все было очень и очень круто! Я в восторге и не перестану рекомендовать зимний отдых только с ними! Горы, солнце, эмоции, конкурсы, каталка, снег, вжух, синие...';
  const TD = 'Дагестан прекрасен! Можно долго восхищаться всей красотой региона и радушием местных жителей. Но самое главное в поездке - люди, без которых ничего бы не случилось бы. Дагестан прекрасен! Можно...';
  const TD_FULL = TD.replace(/Можно\.\.\.$/, 'Можно возвращаться снова и снова, каждый раз открывая что-то новое.');
  const ANS = 'Спасибо за радость, которую вы привезли с собой в Тока-да-Капуава! Всегда пожалуйста! Обнимашки!';
  const ANS_S = 'спасибо большое за теплые слова';
  const FORM_T = 'Спасибо за радость, которую вы привезли с собой в Тока-да-Капуава! Всегда пожалуйста!';
  const SEND_T = 'Ольга, спасибо за тёплые слова! Рады, что поездка в Дербент запомнилась, ждём вас снова.';
  const PH = 'Напишите ответ, который появится на странице вашего профиля, под данным отзывом';
  const TIP_NOTE = ' (этот отзыв доступен только Вам и администрации сервиса)';
  const TOURS = ['Лучшее в Грузии за 7 дней! Го...', 'Легенды Греческих островов', 'Путь самурая в Японии', 'Тур по Турции', 'Тур по Турции', 'Тур по Турции'];
  const SORTS = { new: 'Сначала новые', old: 'Сначала старые', down: 'По убыванию рейтинга', up: 'По возрастанию рейтинга' };

  // ---- Блоки текста отзыва: l — подпись строкой 12/18 и «Показать еще» ниже (Список); r — подпись 13/19, «Показать еще» в строке (Форма ответа);
  //      i — 13/19, подпись в строке или отдельной строкой, «Показать еще» ниже (Форма ответа, отзыв с оценкой организатора)
  const L_TOUR = { m: 'l', k: 'О туре:', t: T3, full: T3_FULL };
  const L_ORG = { m: 'l', k: 'О турлидере', note: TIP_NOTE, t: T3, full: T3_FULL };
  const R_TOUR = { m: 'r', k: 'О туре:', t: T2, full: T3_FULL };
  const R_REC = { m: 'r', k: 'Рекомендации (видны только Вам и администрации сервиса):', t: T2, full: T3_FULL };
  const I_TOUR_PLAIN = { m: 'i', lead: '', t: 'О туре: ' + T19, full: 'О туре: ' + T3_FULL };
  const I_ORG = { m: 'i', lead: 'О турлидере ', note: '(виден только Вам и администрации сервиса):', t: ' ' + T19, full: ' ' + T3_FULL };
  const I_TOUR_B = { m: 'i', lead: 'О туре: ', t: T19, full: T3_FULL };
  const I_REC = { m: 'i', lead: 'Рекомендации (видны только Вам и администрации сервиса): ', t: T19, full: T3_FULL };
  const I_K_TOUR = { m: 'i', k: 'О туре:', t: T19, full: T3_FULL };
  const I_K_ORG = { m: 'i', k: 'О турлидере (виден только Вам и администрации сервиса):', t: T19, full: T3_FULL };
  const L_DAG = { m: 'l', k: 'О туре:', t: TD, full: TD_FULL };

  const OLGA = 'assets/er-olga.jpg';
  let uid = 0;
  const R = (o) => Object.assign({ id: ++uid, tour: 'Древний Дербент', ava: OLGA, name: 'Ольга', rate: 4, date: '2022-06-29', gap: 8, tight: false, blocks: [L_TOUR], tail: { t: 'btn' } }, o);
  const yana = (o = {}) => R(Object.assign({ tour: 'Путешествие в Японию', ava: 'Я', name: 'Яна', tight: true }, o));

  // Наборы строк по кадрам
  const SET = {
    list: () => [yana(), R({ tight: true, gap: 16, blocks: [L_TOUR, L_ORG], tail: { t: 'ans', text: ANS, edit: true } }), R({ date: '2022-06-23', tail: { t: 'ans', text: ANS, edit: false } }), R({ date: '2022-06-19' })],
    short: (edit = true, yanaLabel = true) => [yanaLabel ? yana() : yana({ blocks: [{ m: 'l', t: T3, full: T3_FULL }] }), R({ tight: true, gap: 16, blocks: [L_TOUR, L_ORG], tail: { t: 'ans', text: ANS_S, edit, short: true } }), R(), R()],
    reply: (form) => [yana(), R({ tight: true, gap: 16, blocks: [R_TOUR, R_REC], tail: form }), R(), R({ blocks: [L_DAG] })],
    org: () => [yana({ blocks: [I_TOUR_PLAIN, I_ORG] }), R({ tight: true, gap: 16, blocks: [I_K_TOUR, I_K_ORG], tail: { t: 'form', mode: 'focus', text: FORM_T } }), R({ blocks: [I_TOUR_B, I_REC] }), R({ blocks: [I_TOUR_PLAIN, I_ORG] })],
    edit: () => [yana(), R({ tight: true, gap: 16, blocks: [L_TOUR, L_ORG], tail: { t: 'form', mode: 'edit', text: FORM_T, was: { t: 'ans', text: FORM_T, edit: true, short: true } } }), R(), R({ blocks: [L_DAG] })],
  };

  // Ещё 19 отзывов для «Показать ещё» (всего 23, как в счётчике)
  const MORE = [
    ['Легенды Греческих островов', 'Марина', 5, '2022-06-12', 'Острова, море и очень заботливый гид. Каждый день был не похож на предыдущий, а ужины на набережной запомнятся надолго.'],
    ['Путь самурая в Японии', 'Игорь', 5, '2022-06-08', 'Продуманный маршрут: Киото, Нара и ночь в рёкане. Отдельное спасибо за чайную церемонию и помощь с транспортом.'],
    ['Тур по Турции', 'Светлана', 4, '2022-06-02', 'Каппадокия на рассвете с шаров это мечта. Немного устали от переездов, но впечатления того стоили.'],
    ['Лучшее в Грузии за 7 дней! Го...', 'Денис', 5, '2022-05-28', 'Горы, вино и хинкали, всё как обещали. Группа подобралась отличная, а гид знал каждую тропинку.'],
    ['Древний Дербент', 'Анна', 3, '2022-05-21', 'Город красивый, но жильё в первую ночь было шумным. Экскурсия по крепости Нарын-Кала понравилась больше всего.'],
    ['Легенды Греческих островов', 'Павел', 4, '2022-05-15', 'Санторини и Крит за одну поездку. Хотелось бы больше свободного времени на пляжах.'],
    ['Путешествие в Японию', 'Ксения', 5, '2022-05-09', 'Сакура в Токио и тишина храмов Камакуры. Организация на высоте, всё по минутам.'],
    ['Тур по Турции', 'Олег', 4, '2022-05-03', 'Эфес, Памуккале и турецкие завтраки. Отличное соотношение цены и впечатлений.'],
    ['Путь самурая в Японии', 'Елена', 5, '2022-04-27', 'Лучший тур в моей жизни. Гид рассказывал так, что хотелось слушать ещё и ещё.'],
    ['Древний Дербент', 'Тимур', 5, '2022-04-20', 'Сулакский каньон и древние улицы Дербента. Спасибо за тёплую атмосферу в группе.'],
    ['Лучшее в Грузии за 7 дней! Го...', 'Ирина', 4, '2022-04-14', 'Казбеги и Сигнахи очень понравились. Дорога местами тяжёлая, но виды компенсируют всё.'],
    ['Легенды Греческих островов', 'Алексей', 5, '2022-04-06', 'Море, солнце и прекрасная компания. Обязательно поеду ещё раз.'],
    ['Тур по Турции', 'Мария', 3, '2022-03-30', 'Программа насыщенная, но в отеле в Анталье были проблемы с заселением. Гид помог всё решить.'],
    ['Путешествие в Японию', 'Никита', 4, '2022-03-22', 'Много ходили пешком, зато увидели настоящую Японию, а не только открытки.'],
    ['Древний Дербент', 'Ольга', 5, '2022-03-15', 'Второй раз с этим экспертом, и снова всё отлично. Дагестан покорил окончательно.'],
    ['Путь самурая в Японии', 'Сергей', 5, '2022-03-08', 'Мастер-класс по кендо и ужин с местной семьёй стали главными событиями поездки.'],
    ['Лучшее в Грузии за 7 дней! Го...', 'Вера', 5, '2022-02-27', 'Тбилиси, серные бани и долгие разговоры за столом. Уезжать не хотелось.'],
    ['Тур по Турции', 'Артур', 4, '2022-02-18', 'Хороший маршрут для первой поездки в Турцию. Чуть больше бы свободного времени.'],
    ['Легенды Греческих островов', 'Дарья', 5, '2022-02-09', 'Всё было волшебно: море, закаты и греческая кухня. Спасибо за внимание к каждому.'],
  ];
  const extras = () => MORE.map(([tour, name, rate, date, text]) => R({ tour, name, rate, date, ava: name[0], blocks: [{ m: 'l', k: 'О туре:', t: text }] }));

  // ---- Состояние из адреса ----
  let rows, visibleN = 4, sort = 'new', tourSel = null;
  let mode = 'list';
  if (P.get('s') === 'empty') mode = 'empty';
  else if (P.get('s') === 'loading') mode = 'loading';
  else if (P.has('reply')) mode = P.get('reply') === 'org' ? 'org' : 'reply';
  else if (P.has('send')) mode = 'send';
  else if (P.has('fail')) mode = 'fail';
  else if (P.has('sent')) mode = 'sent';
  else if (P.has('edit')) mode = 'edit';
  else if (P.has('locked')) mode = 'locked';
  else if (P.get('f') === 'tour') mode = 'ftour';
  else if (P.has('tour')) mode = 'tour';

  rows = {
    list: SET.list, empty: () => [], loading: () => [],
    reply: () => SET.reply({ t: 'form', mode: 'empty' }),
    send: () => SET.reply({ t: 'form', mode: 'sending', text: SEND_T, figma: true }),
    fail: () => SET.reply({ t: 'form', mode: 'filled', text: SEND_T, figma: true }),
    org: SET.org, edit: SET.edit,
    sent: () => SET.short(true), tour: () => SET.short(true), locked: () => SET.short(false), ftour: () => SET.short(true, false),
  }[mode]();
  const all = mode === 'empty' || mode === 'loading' ? [] : rows.concat(extras());
  const order = all.slice(); // порядок кадра = «Сначала новые»

  // ---- Отрисовка строки ----
  const ava = (r) => r.ava.length === 1 ? `<span class="er-ava er-ava--letter" aria-hidden="true">${r.ava}</span>` : `<img class="er-ava" src="${r.ava}" alt="">`;
  const MS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  const dLong = (iso) => { const [y, m, d] = iso.split('-').map(Number); return `${d} ${MS[m - 1]} ${y}`; };
  const block = (b, r, i) => {
    const open = r.open && r.open[i], text = open && b.full ? b.full : b.t;
    const more = `<button class="er-more-l" type="button" data-more="${i}">${open ? 'Скрыть' : 'Показать еще'}</button>`;
    if (b.m === 'r') return `<div class="er-blk er-blk--r"><p class="er-blk__k">${tx(b.k)}</p><p class="er-blk__t">${ut(text)}<button class="er-more-i" type="button" data-more="${i}">${open ? 'Скрыть' : 'Показать еще'}</button></p></div>`;
    if (b.m === 'i') {
      const head = b.k ? `<p class="er-blk__k">${tx(b.k)}</p>` : '';
      const lead = b.lead ? `<b>${tx(b.lead)}</b>` + (b.note ? `<b class="er-note">${tx(b.note)}</b>` : '') : '';
      return `<div class="er-blk er-blk--i">${head}<p class="er-blk__t">${lead}${ut(text)}</p>${more}</div>`;
    }
    const k = b.k ? `<p class="er-blk__k">${tx(b.k)}${b.note ? `<span class="er-note">${tx(b.note)}</span>:` : ''}</p>` : '';
    // er-blk__t--clamp: на мобилке свёрнутый текст в 3 строки с многоточием (кадр «ТЭ · Mobile / Отзывы / Список»), на десктопе класс без стилей
    return `<div class="er-blk er-blk--l">${k}<p class="er-blk__t${b.full && b.full !== b.t && !open ? ' er-blk__t--clamp' : ''}">${ut(text)}</p>${b.full && b.full !== b.t ? more : ''}</div>`;
  };
  const blockGap = (b) => b.m === 'i' ? 12 : 16;
  const EXPERT = '<img class="er-answer__ava" src="assets/er-expert.jpg" alt="Константин">';
  const SPIN = '<div class="er-spin" role="status" aria-label="Отправляем ответ"><svg width="39" height="39" viewBox="0 0 37 37" fill="none" aria-hidden="true"><circle cx="18.5" cy="18.5" r="16" stroke="#fff" stroke-width="5"/><path d="M18.5 2.5a16 16 0 1 1-16 16" stroke="url(#er-sg)" stroke-width="5" stroke-linecap="round"/><defs><linearGradient id="er-sg" x1="34.5" y1="15" x2="-.5" y2="26.5" gradientUnits="userSpaceOnUse"><stop stop-color="#ABC232"/><stop offset=".43" stop-color="#ABC232"/><stop offset="1" stop-color="#ABC232" stop-opacity="0"/></linearGradient></defs></svg></div>';
  // Шапка ответа на мобилке (expert-answer 12484:63925): имя, «Тревел-эксперт», «Скрыть ответ». На десктопе .er-m скрыт
  const CHEV_UP = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M3 6.75 6 3.75 9 6.75" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const ansHead = (t) => `<div class="er-m er-answer__head"><span class="er-answer__name">Константин</span><span class="er-answer__role">Тревел-эксперт</span>`
    + `<button class="er-answer__toggle" type="button" data-ans-toggle aria-expanded="${t.hide ? 'false' : 'true'}">${t.hide ? 'Показать ответ' : 'Скрыть ответ'}${CHEV_UP}</button></div>`;
  const tail = (r) => {
    const t = r.tail;
    if (t.t === 'btn') return '<button class="er-btn er-btn--white" type="button" data-reply>Оставьте публичный ответ</button>';
    if (t.t === 'ans') {
      if (t.short) return `<div class="er-answer er-answer--short${t.hide ? ' is-hidden' : ''}">${EXPERT}${ansHead(t)}<div class="er-answer__col"><p>${tx(t.text)}${t.edit ? '<button class="er-edit" type="button" data-edit>(Ред.)</button>' : ''}</p></div></div>`;
      return `<div class="er-answer${t.hide ? ' is-hidden' : ''}">${EXPERT}${ansHead(t)}<div class="er-answer__col"><p>${tx(t.text)}</p>${t.edit ? '<button class="er-edit" type="button" data-edit>(Ред.)</button>' : ''}</div></div>`;
    }
    // форма ответа
    const m = t.mode, busy = m === 'sending', val = t.text || '';
    const cls = ['er-ta', m === 'edit' ? 'er-ta--edit is-focus' : '', m === 'focus' ? 'is-focus' : '', t.figma ? 'is-figma' : ''].join(' ');
    const ok = val.trim().length > 0 && !busy;
    const label = m === 'edit' || t.was ? 'Сохранить' : 'Отправить';
    return `<div class="er-form"><div class="er-form__row">${EXPERT}<div class="er-form__field"><textarea class="${cls}" placeholder="${PH}" aria-label="Публичный ответ на отзыв"${busy ? ' disabled' : ''}>${esc(val)}</textarea>${busy ? SPIN : ''}</div></div>`
      + `<div class="er-form__btns"><button class="er-btn er-btn--grey" type="button" data-cancel${busy ? ' disabled' : ''}>Отмена</button><button class="er-btn er-btn--green" type="button" data-send${ok ? '' : ' disabled'}>${label}</button></div></div>`;
  };
  const rowHtml = (r) => {
    const blocks = r.blocks.map((b, i) => (i ? `<div style="height:${blockGap(b)}px" aria-hidden="true"></div>` : '') + block(b, r, i)).join('');
    const stars = '<img src="assets/er-star16.svg" width="16" height="16" alt="">';
    return `<article class="er-row" data-id="${r.id}"><p class="er-row__tour">${tx(r.tour)}</p><div class="er-row__body">`
      + `<div class="er-review"><div class="er-meta">${ava(r)}<div class="er-who${r.tight ? ' er-who--tight' : ''}"><span class="er-who__name">${r.name}<span class="er-who__mark" aria-label="Оценка ${r.rate}.0">${stars}${r.rate}.0</span></span><span class="er-who__date">${dLong(r.date)}</span></div></div>`
      + `<div style="height:${r.gap}px" aria-hidden="true"></div><div class="er-blocks">${blocks}</div></div>${tail(r)}</div></article>`;
  };
  const SKROW = (a, b) => `<div class="er-skrow" aria-hidden="true"><div class="er-skrow__tour"><span class="er-sk" style="width:${a}px"></span><span class="er-sk" style="width:${b}px"></span></div><div class="er-skrow__body"><div class="er-skrow__meta"><span class="er-sk"></span><div class="er-skrow__who"><span class="er-sk" style="width:96px"></span><span class="er-sk" style="width:72px"></span></div></div><div class="er-skrow__text"><span class="er-sk" style="width:56px"></span><span class="er-sk"></span><span class="er-sk"></span><span class="er-sk" style="width:460px"></span><span class="er-sk" style="width:120px"></span></div><span class="er-sk er-skrow__btn"></span></div></div>`;

  const list = $('#er-rows'), moreWrap = $('.er-more'), none = $('.er-none');
  const filtered = () => {
    let a = order.filter((r) => !tourSel || r.tour === tourSel);
    const t = (r) => new Date(r.date).getTime();
    if (sort === 'old') a = a.slice().sort((x, y) => t(x) - t(y));
    if (sort === 'down') a = a.slice().sort((x, y) => y.rate - x.rate || t(y) - t(x));
    if (sort === 'up') a = a.slice().sort((x, y) => x.rate - y.rate || t(y) - t(x));
    return a;
  };
  const render = () => {
    if (mode === 'loading') { list.innerHTML = SKROW(100, 72) + SKROW(96, 80) + SKROW(104, 64); moreWrap.hidden = true; return; }
    const a = filtered(), vis = a.slice(0, visibleN);
    list.innerHTML = vis.map(rowHtml).join('');
    none.hidden = vis.length > 0;
    moreWrap.hidden = vis.length >= a.length;
  };
  const byId = (el) => all.find((r) => r.id === +el.closest('.er-row').dataset.id);
  const rerow = (r) => { const el = list.querySelector(`.er-row[data-id="${r.id}"]`); if (el) el.outerHTML = rowHtml(r); };

  // ---- Пусто и загрузка ----
  if (mode === 'empty') {
    root.classList.add('is-empty');
    $$('[data-n]').forEach((n) => { n.textContent = n.classList.contains('er-title__n') ? '0' : ' 0'; });
    $('[data-rating]').textContent = '0.0';
    $('[data-mcount]').textContent = '0 отзывов';
  }
  if (mode === 'loading') root.classList.add('is-loading');
  render();
  MOB.addEventListener('change', render);

  // ---- Строки: «Показать еще», ответ, отправка, «(Ред.)» ----
  const send = (r, ta) => {
    const text = ta.value.trim();
    const was = r.tail.was;
    r.tail = { t: 'form', mode: 'sending', text, was };
    rerow(r);
    setTimeout(() => { r.tail = { t: 'ans', text, edit: true, short: true }; rerow(r); }, 1400);
  };
  list.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    const r = byId(b);
    if (b.hasAttribute('data-ans-toggle')) { r.tail.hide = !r.tail.hide; rerow(r); return; }
    if (b.dataset.more !== undefined) { r.open = r.open || {}; r.open[b.dataset.more] = !r.open[b.dataset.more]; rerow(r); return; }
    if (b.hasAttribute('data-reply')) { r.tail = { t: 'form', mode: 'empty' }; rerow(r); $(`.er-row[data-id="${r.id}"] textarea`).focus(); return; }
    if (b.hasAttribute('data-edit')) { r.tail = { t: 'form', mode: 'edit', text: r.tail.text, was: r.tail }; rerow(r); const ta = $(`.er-row[data-id="${r.id}"] textarea`); ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); return; }
    if (b.hasAttribute('data-cancel')) { r.tail = r.tail.was || { t: 'btn' }; rerow(r); return; }
    if (b.hasAttribute('data-send')) { const ta = b.closest('.er-form').querySelector('textarea'); if (!ta.value.trim()) return; send(r, ta); }
  });
  list.addEventListener('input', (e) => {
    const ta = e.target.closest('textarea'); if (!ta) return;
    const r = byId(ta); r.tail.text = ta.value; ta.classList.remove('is-figma');
    ta.closest('.er-form').querySelector('[data-send]').disabled = !ta.value.trim();
  });
  list.addEventListener('focusout', (e) => { const ta = e.target.closest('textarea'); if (ta) ta.classList.remove('is-focus'); });

  // ---- Ошибка отправки (?fail=1): «Повторить» отправляет ещё раз ----
  const fail = $('#er-fail');
  if (mode === 'fail') fail.hidden = false;
  fail.addEventListener('click', (e) => {
    if (e.target === fail || e.target.closest('[data-er-close]')) { fail.hidden = true; return; }
    if (e.target.closest('[data-er-retry]')) {
      fail.hidden = true;
      const r = all.find((x) => x.tail.t === 'form' && x.tail.text);
      const ta = r && $(`.er-row[data-id="${r.id}"] textarea`);
      if (ta) send(r, ta);
    }
  });

  // ---- «Показать ещё»: +10 ----
  $('#er-more').addEventListener('click', () => { visibleN += 10; render(); });

  // ---- Выпадающие списки ----
  const tourBtn = $('#er-tourbtn'), chip = $('#er-tourchip'), tours = $('#er-tours'), q = $('[data-tour-q]'), opts = $('[data-tour-opts]');
  const sortBtn = $('#er-sortbtn'), sorts = $('#er-sorts');
  const fillOpts = () => {
    const s = q.value.trim().toLowerCase();
    const items = TOURS.filter((t) => t.toLowerCase().includes(s));
    opts.innerHTML = items.length ? items.map((t) => `<button class="er-opt" type="button" role="option" data-tour="${esc(t)}">${tx(t)}</button>`).join('') : '<p class="er-opts__none">Ничего не&nbsp;найдено</p>';
  };
  const pops = [[tourBtn, tours], [sortBtn, sorts]];
  const close = () => pops.forEach(([b, p]) => { p.hidden = true; b.setAttribute('aria-expanded', 'false'); });
  const toggle = (b, p) => { const open = p.hidden; close(); if (open) { p.hidden = false; b.setAttribute('aria-expanded', 'true'); if (p === tours) { fillOpts(); q.focus({ preventScroll: true }); } } };
  tourBtn.addEventListener('click', (e) => { e.stopPropagation(); toggle(tourBtn, tours); });
  sortBtn.addEventListener('click', (e) => { e.stopPropagation(); toggle(sortBtn, sorts); });
  q.addEventListener('input', fillOpts);
  const short = (t) => t.length > 13 ? t.slice(0, 13).trimEnd() + '...' : t;
  const setTour = (t) => {
    tourSel = t; close();
    tourBtn.hidden = !!t; chip.hidden = !t;
    if (t) $('[data-chip-label]').textContent = short(t);
    visibleN = 4; render();
  };
  opts.addEventListener('click', (e) => { const o = e.target.closest('[data-tour]'); if (o) setTour(o.dataset.tour); });
  chip.addEventListener('click', () => setTour(null));
  sorts.addEventListener('click', (e) => {
    const o = e.target.closest('[data-sort]'); if (!o) return;
    sort = o.dataset.sort; $$('[data-sort]', sorts).forEach((x) => x.setAttribute('aria-selected', String(x === o)));
    $('[data-sort-label]').textContent = SORTS[sort]; close(); render();
  });
  tours.addEventListener('click', (e) => e.stopPropagation());
  // Крестик в шапке шторки (мобилка)
  pops.forEach(([, p]) => p.querySelector('[data-er-sheetx]').addEventListener('click', (e) => { e.stopPropagation(); close(); }));
  document.addEventListener('click', (e) => { if (!e.target.closest('.er-pop')) close(); if (!e.target.closest('.er-info')) setTip(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { close(); setTip(false); if (!fail.hidden) fail.hidden = true; } });

  // ---- Подсказка у рейтинга ----
  const info = $('.er-info'), tip = $('#er-tip');
  function setTip(on) { tip.hidden = !on; info.setAttribute('aria-expanded', String(on)); }
  info.addEventListener('mouseenter', () => setTip(true));
  info.addEventListener('mouseleave', () => setTip(false));
  info.addEventListener('focus', () => setTip(true));
  info.addEventListener('blur', () => setTip(false));
  info.addEventListener('click', (e) => { e.stopPropagation(); setTip(tip.hidden); });

  // ---- Статичные состояния кадров ----
  if (P.get('tip') === 'rating') setTip(true);
  if (P.has('sort')) toggle(sortBtn, sorts);
  if (mode === 'ftour') {
    toggle(tourBtn, tours); q.blur();
    if (P.has('q')) $('.er-opt', opts).classList.add('is-hover'); // кадр «Поиск в фильтре»: поле пустое, первый пункт под курсором
  }
  if (mode === 'tour') { tourBtn.hidden = true; chip.hidden = false; $('[data-chip-label]').textContent = short(TOURS[1]); }

  // ---- Тост для вкладок вне прототипа ----
  const toast = $('.er-toast'); let tt;
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-er-toast]'); if (!t) return;
    e.preventDefault(); toast.innerHTML = t.dataset.erToast; toast.classList.add('is-on');
    clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('is-on'), 2400);
  });
})();
