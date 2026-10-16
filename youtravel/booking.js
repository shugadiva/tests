// Детали бронирования: аккордеоны, «Раскрыть все дни», копирование номера, тост для выходов из раздела
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // Тост внизу по центру: один на страницу, новый текст сбрасывает таймер
  let toast, timer;
  const showToast = (html) => {
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'bd-toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.append(toast);
    }
    toast.innerHTML = html;
    toast.offsetWidth; // перезапуск перехода
    toast.classList.add('is-on');
    clearTimeout(timer);
    timer = setTimeout(() => toast.classList.remove('is-on'), 2400);
  };

  // Аккордеон: состояние в data-open у обёртки и aria-expanded у кнопки
  const setOpen = (acc, open) => {
    acc.dataset.open = String(open);
    const head = $(':scope > .bd-acc__head, :scope > .bd-pay__row .bd-acc__head', acc);
    head?.setAttribute('aria-expanded', String(open));
  };
  $$('.bd-acc').forEach((acc) => {
    const head = $(':scope > .bd-acc__head, :scope > .bd-pay__row .bd-acc__head', acc);
    head?.addEventListener('click', () => { setOpen(acc, acc.dataset.open !== 'true'); syncAll(); });
  });

  // «Раскрыть все дни»: если хоть один день закрыт, открывает все, иначе сворачивает
  const all = $('#bd-expand-all');
  const days = $$('.bd-program .bd-row');
  const syncAll = () => {
    if (!all) return;
    const open = days.every((d) => d.dataset.open === 'true');
    all.setAttribute('aria-expanded', String(open));
    $('span', all).textContent = open ? 'Свернуть все дни' : 'Раскрыть все дни';
  };
  all?.addEventListener('click', () => {
    const open = !days.every((d) => d.dataset.open === 'true');
    days.forEach((d) => setOpen(d, open));
    syncAll();
  });
  syncAll();

  // ?pay=1: состояние «оплата раскрыта» (как экран МП 4690): скидки и доп. услуги раскрыты, у «Оплачено» стрелка
  if (new URLSearchParams(location.search).get('pay') === '1') {
    ['bd-discounts', 'bd-addons'].forEach((id) => { const acc = document.getElementById(id)?.closest('.bd-acc'); if (acc) setOpen(acc, true); });
    document.body.classList.add('bd-pay-open');
  }

  // Копирование номера бронирования, на file:// запасной путь через execCommand
  $$('[data-bd-copy]').forEach((b) => b.addEventListener('click', async () => {
    const text = b.dataset.bdCopy;
    try { await navigator.clipboard.writeText(text); } catch (_) {
      const t = document.createElement('textarea');
      t.value = text; t.style.position = 'fixed'; t.style.opacity = '0';
      document.body.append(t); t.select();
      try { document.execCommand('copy'); } catch (__) { /* буфер недоступен */ }
      t.remove();
    }
    showToast('Номер скопирован');
  }));

  // Липкая колонка оплаты: если она выше окна, top уходит в минус, чтобы низ с кнопками оставался виден
  const aside = $('.bd-aside');
  const fitSticky = () => {
    if (!aside) return;
    const gap = 20;
    // низ не заходит под панель «Состояния» (fixed внизу слева)
    const states = $('.states');
    const limit = states ? states.getBoundingClientRect().top - 16 : innerHeight - gap;
    aside.style.top = `${Math.min(gap, limit - aside.offsetHeight)}px`;
  };
  if (aside) {
    new ResizeObserver(fitSticky).observe(aside);
    addEventListener('resize', fitSticky);
    fitSticky();
  }

  // Выходы из раздела: оплата, отмена, чат, страница тура, профиль эксперта
  $$('[data-bd-toast]').forEach((el) => el.addEventListener('click', (e) => {
    e.preventDefault();
    showToast(el.dataset.bdToast);
  }));
})();
