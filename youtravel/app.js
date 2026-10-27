// Общее поведение прототипа (окна .overlay, мобильное меню) и раздел «Мои отзывы» путешественника.
// Состояния отзывов открываются адресом: index.html?open=text, step-1.html?photo=mixed и т.п. (список в src/build.py, NAV)
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const q = new URLSearchParams(location.search);

  // Общие окна .overlay (заявки эксперта и др.): закрытие по крестику, кнопке, подложке и Esc
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
  // Мобильная шапка: меню открывает кнопка в круге слева
  $('.mh-burger')?.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
  document.addEventListener('click', (e) => { if (menu?.classList.contains('is-open') && (!e.target.closest('.lk-sidebar, .user, .mh-burger') || e.target.closest('.sheet-close'))) setMenu(false); });

  /* ===== Мои отзывы ===== */
  if (!$('.rv')) return;

  // Окна отзывов (.rv-overlay): крестик, кнопка с data-close, подложка, Esc. Спиннеры так не закрываются.
  const open = (id) => { const ov = document.getElementById(id); if (ov) ov.hidden = false; return ov; };
  const close = (ov) => { if (ov) ov.hidden = true; };
  $$('.rv-overlay').forEach((ov) => {
    if (ov.classList.contains('rv-overlay--plain')) return;
    ov.addEventListener('click', (e) => { if (e.target === ov || e.target.closest('[data-close]')) close(ov); });
  });

  // Просмотр фото «N из M» со стрелками
  const viewer = $('#viewer');
  let photos = [], cur = 0;
  const show = (i) => {
    cur = (i + photos.length) % photos.length;
    $('#viewer-img').src = photos[cur];
    $('#viewer-count').textContent = `${cur + 1} из ${photos.length}`;
  };
  const openViewer = (list, i) => { photos = list; show(i); viewer.hidden = false; };
  if (viewer) {
    $('.rv-viewer__prev', viewer).addEventListener('click', () => show(cur - 1));
    $('.rv-viewer__next', viewer).addEventListener('click', () => show(cur + 1));
    $('.rv-viewer__close', viewer).addEventListener('click', () => { viewer.hidden = true; });
    viewer.addEventListener('click', (e) => { if (e.target === viewer) viewer.hidden = true; });
  }
  document.addEventListener('keydown', (e) => {
    if (viewer && !viewer.hidden) {
      if (e.key === 'ArrowLeft') show(cur - 1);
      if (e.key === 'ArrowRight') show(cur + 1);
      if (e.key === 'Escape') viewer.hidden = true;
      return;
    }
    if (e.key === 'Escape') $$('.rv-overlay:not([hidden]):not(.rv-overlay--plain)').forEach(close);
  });

  /* --- Список --- */
  const list = $('#reviews-list');
  if (list) {
    const onlyPhotos = $('#only-photos');
    const filter = () => $$('.rv-list > li', list).forEach((li) => li.classList.toggle('is-hidden', onlyPhotos.checked && !li.hasAttribute('data-photos')));
    onlyPhotos.addEventListener('change', filter);
    if (q.has('photos')) { onlyPhotos.checked = true; filter(); }

    // Текст отзыва: «Показать ещё» / «Скрыть»
    const toggleText = (about, force) => {
      const on = about.classList.toggle('is-open', force);
      $('.rv-about__more', about).textContent = on ? 'Скрыть' : 'Показать ещё';
    };
    $$('.rv-about', list).forEach((about) => $('.rv-about__more', about).addEventListener('click', () => toggleText(about)));

    // Ответ тревел-эксперта: «Смотреть ответ» / «Скрыть ответ»
    const toggleAnswer = (btn, force) => {
      const on = force ?? btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(on));
      $('.rv-answer__label', btn).textContent = on ? 'Скрыть ответ' : 'Смотреть ответ';
      btn.closest('.rv-answer').querySelector('.rv-answer__text').hidden = !on;
    };
    $$('.rv-answer__toggle', list).forEach((b) => b.addEventListener('click', () => toggleAnswer(b)));

    // ⓘ у «Не опубликован»: подсказка при наведении, окно причин по клику
    $$('.rv-why__btn', list).forEach((b) => b.addEventListener('click', () => { b.closest('.rv-why').classList.remove('is-tip'); open('dlg-reasons'); }));

    // Фото отзыва: просмотр всех 7 фото
    const all = (viewer?.dataset.photos || '').split(' ').filter(Boolean);
    $$('.rv-photo', list).forEach((b) => b.addEventListener('click', () => openViewer(all, +b.dataset.i)));

    // Состояния по адресу
    const pub = $('#r-published');
    if (q.get('open') === 'text') toggleText($('.rv-about', pub), true);
    if (q.get('open') === 'answer') toggleAnswer($('.rv-answer__toggle', pub), true);
    if (q.has('tip')) $('#r-rejected .rv-why').classList.add('is-tip');
    if (q.get('dlg') === 'reasons') open('dlg-reasons');
    if (q.has('viewer')) openViewer(all, 1);
  }

  /* --- Форма, шаги 1 и 2 --- */
  const form = $('#review-step-1') || $('#review-step-2');
  if (!form) return;
  const submit = $('.rv-btn-submit', form);

  const setRating = (field, n) => $$('.rv-scale button', field).forEach((b) => b.setAttribute('aria-checked', String(+b.textContent === n)));
  const fieldOf = (el) => el.closest('.rv-field');
  const fieldOk = (field) => field.dataset.required === 'rating' ? !!$('[aria-checked="true"]', field) : !!$('.rv-textarea', field).value.trim();
  const refresh = () => {
    $$('.rv-field.is-error', form).forEach((f) => { if (fieldOk(f)) f.classList.remove('is-error'); });
    submit.disabled = !!$('.rv-field.is-error', form);
  };
  const validate = () => {
    let first = null;
    $$('[data-required]', form).forEach((f) => {
      const ok = fieldOk(f);
      f.classList.toggle('is-error', !ok);
      if (!ok && !first) first = f;
    });
    submit.disabled = !!first;
    if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return !first;
  };
  const showErrors = () => { $$('[data-required]', form).forEach((f) => f.classList.add('is-error')); submit.disabled = true; };
  const clear = () => {
    $$('.rv-scale button', form).forEach((b) => b.setAttribute('aria-checked', 'false'));
    $$('.rv-textarea', form).forEach((t) => { t.value = ''; });
  };

  $$('.rv-scale', form).forEach((scale) => scale.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    setRating(fieldOf(scale), +b.textContent);
    refresh();
  }));
  $$('.rv-textarea', form).forEach((t) => t.addEventListener('input', refresh));

  // Фото (шаг 1): до 7 штук, до 5 Мб, удаление, просмотр
  const tiles = $('#tiles');
  if (tiles) {
    const MAX = 7, MAX_SIZE = 5 * 1024 * 1024;
    const trash = $('.rv-tile__del')?.innerHTML || '';
    const spin = '<svg class="rv-tile__spin" width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true">' +
      [[0.87, 135, 12.8789, 10.0498], [0.75, 90, 10, 13], [0.63, 45, 10.0508, 17.1211], [0.51, 0, 13, 20], [0.39, 135, 27.0234, 24.1924], [0.27, 90, 30, 13], [0.15, 45, 24.1953, 2.97949], [1, 0, 13, 0]]
        .map(([o, r, x, y]) => `<rect opacity="${o}" x="${x}" y="${y}" width="4" height="10" rx="2"${r ? ` transform="rotate(${r} ${x} ${y})"` : ''} fill="#EBEEF4"/>`).join('') + '</svg>';
    const add = $('#add-photo'), input = $('input', add);
    const del = `<button class="rv-tile__del" type="button" aria-label="Удалить фото">${trash}</button>`;
    const make = (kind, src) => {
      const t = document.createElement('div');
      if (kind === 'error') { t.className = 'rv-tile rv-tile--error'; t.innerHTML = `<span>Ошибка загрузки</span>${del}`; }
      else if (kind === 'size') { t.className = 'rv-tile rv-tile--error'; t.innerHTML = `<span>Фото превышает <b>5 Мб</b></span>${del}`; }
      else { t.className = 'rv-tile' + (kind === 'loading' ? ' rv-tile--loading' : ''); t.innerHTML = `<img src="${src}" alt="">${kind === 'loading' ? spin : ''}${del}`; }
      return t;
    };
    const count = () => $$('.rv-tile:not(.rv-tile--error)', tiles).length;
    const sync = () => add.classList.toggle('is-disabled', count() >= MAX);
    const setTiles = (items) => { tiles.replaceChildren(...items.map(([k, s]) => make(k, s))); sync(); };

    tiles.addEventListener('click', (e) => {
      if (e.target.closest('.rv-tile__del')) { e.target.closest('.rv-tile').remove(); sync(); return; }
      const img = e.target.closest('.rv-tile:not(.rv-tile--loading) img');
      if (img) {
        const list = $$('.rv-tile:not(.rv-tile--loading):not(.rv-tile--error) img', tiles).map((i) => i.getAttribute('src'));
        openViewer(list, list.indexOf(img.getAttribute('src')));
      }
    });
    input.addEventListener('change', () => {
      const files = [...input.files];
      input.value = '';
      if (!files.length) return;
      const proc = open('dlg-processing');
      setTimeout(() => {
        close(proc);
        files.forEach((file) => {
          if (count() >= MAX) return;
          if (file.size > MAX_SIZE) { tiles.append(make('size')); return; }
          const t = make('loading', URL.createObjectURL(file));
          tiles.append(t);
          setTimeout(() => { t.classList.remove('rv-tile--loading'); $('.rv-tile__spin', t)?.remove(); }, 1500);
        });
        sync();
      }, 700);
    });

    // Состояния шага 1
    const P = (n) => `assets/photo-${n}.jpg`;
    const base = [['ok', P(1)], ['ok', P(2)], ['ok', P(3)]];
    const s = q.get('s'), photo = q.get('photo');
    if (s === 'empty' || s === 'errors') { clear(); setTiles([]); }
    if (s === 'errors') showErrors();
    if (s === 'filled') {
      $('#t-group').value = 'Группа подобралась дружная: быстро нашли общий язык и помогали друг другу на подъёмах. С некоторыми договорились поехать вместе на Алтай.';
      $('#t-wish').value = 'Хотелось бы заранее получить список вещей для восхождения и чуть больше свободного времени в Петропавловске.';
    }
    if (photo === 'loading') setTiles([...base, ['loading', P(3)], ['loading', P(1)], ['loading', P(1)]]);
    if (photo === 'mixed') setTiles([...base, ['loading', P(3)], ['error'], ['size']]);
    if (photo === 'limit') setTiles([...base, ['ok', 'assets/big-5.jpg'], ['ok', 'assets/big-4.jpg'], ['ok', P(2)], ['ok', P(1)]]);
    if (photo === 'processing') open('dlg-processing');
    if (q.has('viewer')) openViewer(base.map(([, src]) => src), 0);
  }

  // Шаг 2: отправка, ошибка с «Повторить», успех
  const send = () => {
    close($('#dlg-error'));
    submit.disabled = true;
    const sending = open('dlg-sending');
    setTimeout(() => {
      close(sending);
      if (q.has('fail') && !send.retried) { send.retried = true; submit.disabled = false; open('dlg-error'); return; }
      location.href = 'success.html';
    }, 1500);
  };
  $('#retry')?.addEventListener('click', () => { send.retried = true; send(); });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (form.id === 'review-step-1') location.href = 'step-2.html';
    else send();
  });

  if (form.id === 'review-step-2') {
    const s = q.get('s');
    if (s === 'errors') { clear(); showErrors(); }
    if (s === 'sending') { submit.disabled = true; open('dlg-sending'); }
    if (q.has('fail')) { send.retried = true; open('dlg-error'); }
    if ($('#dlg-success')) open(q.has('bonus') ? 'dlg-bonus' : 'dlg-success');
  }
})();
