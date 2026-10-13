// Поведение страниц тестового: форма отзыва (шаги 1 и 2), фото, проверка полей, автосохранение, отправка и диалоги
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // Диалоги: закрытие по крестику, кнопке «Закрыть», клику по подложке и Esc
  const closeDialog = (ov) => { ov.hidden = true; };
  $$('.overlay').forEach((ov) => {
    ov.addEventListener('click', (e) => { if (e.target === ov || e.target.closest('[data-close]')) closeDialog(ov); });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') $$('.overlay:not([hidden])').forEach((ov) => { if (ov.id !== 'dlg-loading') closeDialog(ov); });
  });

  // Мобильная шапка: меню кабинета по нажатию на аватар
  const user = $('.user'), menu = $('.lk-sidebar');
  const mobile = () => matchMedia('(max-width: 640px)').matches;
  const setMenu = (open) => { menu.classList.toggle('is-open', open); document.body.classList.toggle('menu-open', open); };
  user?.addEventListener('click', (e) => { if (!mobile()) return; e.preventDefault(); setMenu(!menu.classList.contains('is-open')); });
  document.addEventListener('click', (e) => { if (menu?.classList.contains('is-open') && !e.target.closest('.lk-sidebar, .user')) setMenu(false); });

  // Список: фильтр «Только с фото»
  $('#only-photos')?.addEventListener('change', (e) => {
    $$('.list > li').forEach((li) => li.classList.toggle('is-hidden', e.target.checked && !li.hasAttribute('data-photos')));
  });

  // Карточка отзыва: статус из адреса (?s=published|moderation|rejected)
  const review = $('#review');
  if (review) {
    const s = new URLSearchParams(location.search).get('s');
    if (['published', 'moderation', 'rejected'].includes(s)) review.dataset.status = s;

    const text = $('#review-text'), more = $('#more');
    if (text.scrollHeight <= text.clientHeight + 2) more.hidden = true;
    more.addEventListener('click', () => {
      const open = text.classList.toggle('clamp');
      more.textContent = open ? 'Показать полностью' : 'Свернуть';
    });

    const toggle = $('.answer__toggle'), body = $('#answer-body');
    toggle?.addEventListener('click', () => {
      const open = body.hidden;
      body.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
      $('.answer__label', toggle).textContent = open ? 'Скрыть ответ тревел-эксперта' : 'Смотреть ответ тревел-эксперта';
    });

    $('#why')?.addEventListener('click', () => { $('#dlg-reasons').hidden = false; });

    // Просмотр фото
    const photos = ($('#photos').dataset.full || '').split(' ').filter(Boolean);
    const viewer = $('#viewer'), img = $('#viewer-img'), count = $('#viewer-count');
    let cur = 0;
    const show = (i) => { cur = (i + photos.length) % photos.length; img.src = photos[cur]; count.textContent = `${cur + 1} из ${photos.length}`; };
    $$('#photos button').forEach((b) => b.addEventListener('click', () => { show(+b.dataset.i); viewer.hidden = false; }));
    $('.viewer__prev').addEventListener('click', () => show(cur - 1));
    $('.viewer__next').addEventListener('click', () => show(cur + 1));
    viewer.addEventListener('click', (e) => { if (e.target === viewer || e.target.closest('[data-close]')) viewer.hidden = true; });
    document.addEventListener('keydown', (e) => {
      if (viewer.hidden) return;
      if (e.key === 'ArrowLeft') show(cur - 1);
      if (e.key === 'ArrowRight') show(cur + 1);
      if (e.key === 'Escape') viewer.hidden = true;
    });
  }

  const form = $('#review-step-1') || $('#review-step-2');
  if (!form) return;

  const autosave = $('#autosave');
  let saveTimer;
  const markDirty = () => {
    autosave.textContent = 'Сохраняем…';
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { autosave.textContent = 'Сохранено как черновик'; }, 900);
  };

  // Шкалы оценки 1-5
  $$('.scale', form).forEach((scale) => {
    scale.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      $$('button', scale).forEach((x) => x.setAttribute('aria-checked', String(x === b)));
      scale.closest('.field').classList.remove('is-error');
      markDirty();
    });
  });

  // Тексты
  $$('.textarea', form).forEach((t) => t.addEventListener('input', () => {
    if (t.value.trim()) t.closest('.field').classList.remove('is-error');
    markDirty();
  }));

  // Фото (шаг 1)
  const tiles = $('#tiles');
  if (tiles) {
    const MAX_PHOTOS = 7, MAX_SIZE = 5 * 1024 * 1024;
    const trash = $('.tile__del')?.innerHTML || '';
    const addLabel = $('#add-photo');
    const fileInput = $('input', addLabel);
    const count = () => $$('.tile:not(.tile--error)', tiles).length;
    const syncAdd = () => {
      addLabel.classList.toggle('is-disabled', count() >= MAX_PHOTOS);
      $('#photo-count').textContent = count();
    };
    tiles.addEventListener('click', (e) => {
      const del = e.target.closest('.tile__del');
      if (!del) return;
      del.closest('.tile').remove();
      syncAdd();
      markDirty();
    });
    fileInput.addEventListener('change', () => {
      [...fileInput.files].forEach((file) => {
        if (count() >= MAX_PHOTOS) return;
        const tile = document.createElement('div');
        if (file.size > MAX_SIZE) {
          tile.className = 'tile tile--error';
          tile.innerHTML = `<span>Фото<br>превышает 5&nbsp;МБ</span><button class="tile__del" type="button" aria-label="Убрать">${trash}</button>`;
        } else {
          tile.className = 'tile tile--loading';
          tile.innerHTML = `<img src="${URL.createObjectURL(file)}" alt=""><button class="tile__del" type="button" aria-label="Удалить фото">${trash}</button>`;
          setTimeout(() => tile.classList.remove('tile--loading'), 1200);
        }
        tiles.append(tile);
      });
      fileInput.value = '';
      syncAdd();
      markDirty();
    });
    syncAdd();
  }

  const validate = () => {
    let first = null;
    $$('[data-required]', form).forEach((field) => {
      const kind = field.dataset.required;
      const ok = kind === 'rating' ? !!$('[aria-checked="true"]', field)
        : kind === 'text' ? !!$('.textarea', field).value.trim()
        : true;
      field.classList.toggle('is-error', !ok);
      if (!ok && !first) first = field;
    });
    if (first) {
      first.scrollIntoView({ behavior: 'smooth', block: 'center' });
      ($('.textarea', first) || $('button', first)).focus({ preventScroll: true });
    }
    return !first;
  };

  // Отправка (шаг 2): загрузка, ошибка с «Повторить», успех
  const fail = new URLSearchParams(location.search).has('fail');
  let attempts = 0;
  const send = () => {
    const loading = $('#dlg-loading');
    $('#dlg-error').hidden = true;
    loading.hidden = false;
    attempts += 1;
    setTimeout(() => {
      loading.hidden = true;
      if (fail && attempts === 1) { $('#dlg-error').hidden = false; $('#retry').focus(); return; }
      location.href = 'success.html';
    }, 1500);
  };
  $('#retry')?.addEventListener('click', send);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (form.id === 'review-step-1') location.href = 'step-2.html';
    else send();
  });
})();
