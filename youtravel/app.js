// Поведение формы отзыва: оценки, фото, проверка обязательных полей, автосохранение черновика
(() => {
  const form = document.getElementById('review-step-1');
  if (!form) return;

  const MAX_PHOTOS = 7;
  const MAX_SIZE = 5 * 1024 * 1024;
  const trash = document.querySelector('.tile__del')?.innerHTML || '';
  const toast = document.getElementById('toast');
  const autosave = document.getElementById('autosave');
  const tiles = document.getElementById('tiles');
  const addLabel = document.getElementById('add-photo');
  const fileInput = addLabel.querySelector('input');

  const showToast = (text) => {
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

  // Шкалы оценки
  form.querySelectorAll('.scale').forEach((scale) => {
    scale.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      scale.querySelectorAll('button').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
      scale.closest('.field').classList.remove('is-error');
      markDirty();
    });
  });

  // Тексты
  form.querySelectorAll('.textarea').forEach((t) => t.addEventListener('input', () => {
    if (t.value.trim()) t.closest('.field').classList.remove('is-error');
    markDirty();
  }));

  // Фото
  const photoCount = () => tiles.querySelectorAll('.tile:not(.tile--error)').length;
  const syncAdd = () => addLabel.classList.toggle('is-disabled', photoCount() >= MAX_PHOTOS);
  tiles.addEventListener('click', (e) => {
    const del = e.target.closest('.tile__del');
    if (!del) return;
    del.closest('.tile').remove();
    syncAdd();
    markDirty();
  });
  fileInput.addEventListener('change', () => {
    [...fileInput.files].forEach((file) => {
      if (photoCount() >= MAX_PHOTOS) return;
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

  // Проверка перед переходом к шагу 2
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let first = null;
    form.querySelectorAll('[data-required]').forEach((field) => {
      const ok = field.dataset.required === 'rating'
        ? !!field.querySelector('[aria-checked="true"]')
        : !!field.querySelector('.textarea').value.trim();
      field.classList.toggle('is-error', !ok);
      if (!ok && !first) first = field;
    });
    if (first) {
      first.scrollIntoView({ behavior: 'smooth', block: 'center' });
      (first.querySelector('.textarea') || first.querySelector('button')).focus({ preventScroll: true });
      return;
    }
    showToast('Шаг 1 заполнен. Шаг 2 появится в следующей версии макета');
  });

  syncAdd();
})();
