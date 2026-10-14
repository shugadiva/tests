// Раздел «Мои бронирования»: тост для выходов из раздела, копирование номера, «Показать ещё», переход со скелетона
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // Тост внизу по центру: один на страницу, новый текст сбрасывает таймер
  let toast, timer;
  const showToast = (html) => {
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'bk-toast';
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

  // Выходы из раздела: оплата, отмена, чат, страница тура, каталог
  $$('[data-toast]').forEach((el) => el.addEventListener('click', (e) => {
    e.preventDefault();
    showToast(el.dataset.toast);
  }));

  // Копирование номера бронирования
  $$('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(b.dataset.copy); } catch (_) { /* file:// без доступа к буферу */ }
    showToast(`Номер ${b.dataset.copy} скопирован`);
  }));

  // «Показать ещё»: открывает скрытые карточки, если их нет, кнопка уходит
  $$('[data-more-button]').forEach((b) => b.addEventListener('click', () => {
    b.setAttribute('aria-busy', 'true');
    b.textContent = 'Загружаем…';
    setTimeout(() => {
      $$('[data-more][hidden]').forEach((c) => { c.hidden = false; });
      b.remove();
    }, 600);
  }));

  // Загрузка: через 1,5 с показываем активные бронирования
  if ($('#bk-loading')) setTimeout(() => { location.href = 'bookings.html'; }, 1500);
})();

// Мобильная карточка: чип статуса раскрывает и сворачивает ленту шагов
document.querySelectorAll('.bk-status--toggle').forEach((b) => b.addEventListener('click', () => {
  const open = b.getAttribute('aria-expanded') !== 'true';
  b.setAttribute('aria-expanded', String(open));
  document.getElementById(b.getAttribute('aria-controls')).hidden = !open;
}));
