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

  const form = $('#review-step-1') || $('#review-step-2');
  if (!form) return;

  const toast = $('#toast');
  const autosave = $('#autosave');
  const showToast = (text) => {
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add('is-on');
    clearTimeout(showToast.t);
    showToast.t = setTimeout(() => toast.classList.remove('is-on'), 2600);
  };
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

  // NPS 1-10
  const range = $('#nps');
  if (range) {
    const sync = () => {
      $('#nps-value').textContent = range.value;
      range.style.setProperty('--fill', ((range.value - 1) / 9) * 100 + '%');
    };
    range.addEventListener('input', () => { sync(); markDirty(); });
    sync();
  }

  // Фото (шаг 1)
  const tiles = $('#tiles');
  if (tiles) {
    const MAX_PHOTOS = 7, MAX_SIZE = 5 * 1024 * 1024;
    const trash = $('.tile__del')?.innerHTML || '';
    const addLabel = $('#add-photo');
    const fileInput = $('input', addLabel);
    const count = () => $$('.tile:not(.tile--error)', tiles).length;
    const syncAdd = () => addLabel.classList.toggle('is-disabled', count() >= MAX_PHOTOS);
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
          tile.innerHTML = `<span>Фото<br>превышает 5&nbsp;мб</span><button class="tile__del" type="button" aria-label="Убрать">${trash}</button>`;
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
