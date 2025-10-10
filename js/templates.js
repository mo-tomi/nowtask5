// ========================================
// テンプレート管理機能
// ========================================

/**
 * テンプレート一覧を取得
 */
function getTemplates() {
  return loadFromStorage(STORAGE_KEYS.TEMPLATES, []);
}

/**
 * テンプレートを保存
 */
function saveTemplates(templates) {
  return saveToStorage(STORAGE_KEYS.TEMPLATES, templates);
}

/**
 * テンプレートを追加
 */
function addTemplate(name, duration, startTime, endTime, memo) {
  const templates = getTemplates();

  const newTemplate = {
    id: generateUUID(),
    name: name || '',
    duration: duration || null,
    startTime: startTime || null,
    endTime: endTime || null,
    memo: memo || '',
    createdAt: new Date().toISOString()
  };

  templates.push(newTemplate);
  saveTemplates(templates);
  return newTemplate;
}

/**
 * テンプレートを削除
 */
function deleteTemplate(templateId) {
  const templates = getTemplates();
  const filtered = templates.filter(t => t.id !== templateId);
  saveTemplates(filtered);
}

/**
 * テンプレート選択モーダルを開く
 */
function openTemplateModal() {
  const modal = document.getElementById('template-modal');
  if (!modal) return;

  renderTemplatesList();
  modal.style.display = 'flex';
  modal.classList.add('show');
}

/**
 * テンプレート選択モーダルを閉じる
 */
function closeTemplateModal() {
  const modal = document.getElementById('template-modal');
  if (!modal) return;

  modal.style.display = 'none';
  modal.classList.remove('show');
}

/**
 * テンプレート一覧を描画
 */
function renderTemplatesList() {
  const container = document.getElementById('templates-list');
  if (!container) return;

  const templates = getTemplates();
  container.innerHTML = '';

  if (templates.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #999; padding: 40px 20px;">テンプレートがありません<br>タスク作成画面で入力後、「現在の入力内容をテンプレートとして保存」ボタンを押してください</p>';
    return;
  }

  templates.forEach(template => {
    const item = createTemplateItem(template);
    container.appendChild(item);
  });
}

/**
 * テンプレートアイテムを作成
 */
function createTemplateItem(template) {
  const item = document.createElement('div');
  item.className = 'template-item';

  const info = document.createElement('div');
  info.className = 'template-info';

  const name = document.createElement('div');
  name.className = 'template-name';
  name.textContent = template.name;

  const details = document.createElement('div');
  details.className = 'template-details';

  const detailsArr = [];
  if (template.startTime) {
    detailsArr.push(`開始: ${template.startTime.substring(0, 5)}`);
  }
  if (template.endTime) {
    detailsArr.push(`終了: ${template.endTime.substring(0, 5)}`);
  }
  if (template.duration) {
    const hours = Math.floor(template.duration / 60);
    const minutes = template.duration % 60;
    if (hours > 0) {
      detailsArr.push(`所要: ${hours}時間${minutes > 0 ? minutes + '分' : ''}`);
    } else {
      detailsArr.push(`所要: ${minutes}分`);
    }
  }
  details.textContent = detailsArr.join(' / ') || '時間未設定';

  info.appendChild(name);
  info.appendChild(details);

  const actions = document.createElement('div');
  actions.className = 'template-actions';

  // 使用ボタン
  const useBtn = document.createElement('button');
  useBtn.className = 'template-use-btn';
  useBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>';
  useBtn.title = 'このテンプレートを使用';
  useBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    applyTemplate(template);
  });

  // 削除ボタン
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'template-delete-btn';
  deleteBtn.innerHTML = '×';
  deleteBtn.title = 'テンプレートを削除';
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (confirm(`「${template.name}」を削除しますか?`)) {
      deleteTemplate(template.id);
      renderTemplatesList();
    }
  });

  actions.appendChild(useBtn);
  actions.appendChild(deleteBtn);

  item.appendChild(info);
  item.appendChild(actions);

  // アイテムクリックでも適用
  item.addEventListener('click', () => {
    applyTemplate(template);
  });

  return item;
}

/**
 * テンプレートを適用
 */
function applyTemplate(template) {
  // タスク名
  const titleInput = document.getElementById('task-title');
  if (titleInput) {
    titleInput.value = template.name;
    // 文字数カウントを更新
    const charCount = document.getElementById('title-char-count');
    if (charCount) {
      charCount.textContent = template.name.length;
    }
    // 保存ボタンを有効化
    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
      saveBtn.disabled = false;
    }
  }

  // メモ
  const memoInput = document.getElementById('task-memo');
  if (memoInput && template.memo) {
    memoInput.value = template.memo;
  }

  // 所要時間
  const durationSelect = document.getElementById('task-duration');
  if (durationSelect && template.duration) {
    durationSelect.value = template.duration;
  }

  // 開始時刻
  const startTimeInput = document.getElementById('task-start-time');
  if (startTimeInput && template.startTime) {
    startTimeInput.value = template.startTime;
  }

  // 終了時刻
  const endTimeInput = document.getElementById('task-end-time');
  if (endTimeInput && template.endTime) {
    endTimeInput.value = template.endTime;
  }

  // モーダルを閉じる
  closeTemplateModal();
}

/**
 * テンプレート入力フォームを表示
 */
function showTemplateInputForm() {
  const form = document.getElementById('template-input-form');
  const addBtn = document.getElementById('add-template-btn');

  if (form && addBtn) {
    form.style.display = 'block';
    addBtn.style.display = 'none';

    // フォームをクリア
    document.getElementById('template-name-input').value = '';
    document.getElementById('template-memo-input').value = '';
    document.getElementById('template-duration-input').value = '';
    document.getElementById('template-start-time-input').value = '';
    document.getElementById('template-end-time-input').value = '';
  }
}

/**
 * テンプレート入力フォームを非表示
 */
function hideTemplateInputForm() {
  const form = document.getElementById('template-input-form');
  const addBtn = document.getElementById('add-template-btn');

  if (form && addBtn) {
    form.style.display = 'none';
    addBtn.style.display = 'block';
  }
}

/**
 * テンプレート入力フォームから保存
 */
function saveTemplateFromForm() {
  const nameInput = document.getElementById('template-name-input');
  const memoInput = document.getElementById('template-memo-input');
  const durationSelect = document.getElementById('template-duration-input');
  const startTimeInput = document.getElementById('template-start-time-input');
  const endTimeInput = document.getElementById('template-end-time-input');

  const name = nameInput ? nameInput.value.trim() : '';

  if (!name) {
    alert('タスク名を入力してください');
    return;
  }

  const memo = memoInput ? memoInput.value.trim() : '';
  const duration = durationSelect ? parseInt(durationSelect.value) || null : null;
  const startTime = startTimeInput ? startTimeInput.value : null;
  const endTime = endTimeInput ? endTimeInput.value : null;

  addTemplate(name, duration, startTime, endTime, memo);
  hideTemplateInputForm();
  renderTemplatesList();

  alert(`「${name}」をテンプレートとして保存しました`);
}
