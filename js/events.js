// ========================================
// イベントリスナー設定
// ========================================

function initEventListeners() {
  // タブ切り替え
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.dataset.tab);
    });
  });

  // ゴミ箱アイコン
  document.getElementById('trash-icon-btn').addEventListener('click', () => {
    switchTab('trash');
  });

  // 設定アイコン
  document.getElementById('settings-icon-btn').addEventListener('click', () => {
    openSettingsModal();
  });

  // 設定モーダルを閉じる
  document.getElementById('close-settings-btn').addEventListener('click', () => {
    closeSettingsModal();
  });

  // 設定保存
  document.getElementById('save-settings-btn').addEventListener('click', () => {
    saveSettings();
  });

  // 完了済み折りたたみ
  const completedToggle = document.getElementById('completed-toggle');
  const completedContent = document.getElementById('completed-content');
  completedToggle.addEventListener('click', () => {
    completedToggle.classList.toggle('open');
    completedContent.classList.toggle('open');
  });

  // FAB（新規作成）
  document.getElementById('create-task-btn').addEventListener('click', () => {
    openCreateModal();
  });

  // モーダル閉じる
  document.getElementById('close-modal-btn').addEventListener('click', () => {
    closeModal();
  });

  document.getElementById('cancel-btn').addEventListener('click', () => {
    closeModal();
  });

  // モーダル外クリックで閉じる
  document.getElementById('task-modal').addEventListener('click', (e) => {
    if (e.target.id === 'task-modal') {
      closeModal();
    }
  });

  document.getElementById('settings-modal').addEventListener('click', (e) => {
    if (e.target.id === 'settings-modal') {
      closeSettingsModal();
    }
  });

  // 保存ボタン
  document.getElementById('save-btn').addEventListener('click', () => {
    saveTask();
  });

  // 削除ボタン
  document.getElementById('delete-btn').addEventListener('click', () => {
    deleteCurrentTask();
  });

  // タイトル入力時の文字数カウント
  const titleInput = document.getElementById('task-title');
  titleInput.addEventListener('input', () => {
    const count = titleInput.value.length;
    document.getElementById('title-char-count').textContent = count;
    document.getElementById('save-btn').disabled = count === 0;
  });

  // タイマーボタン
  document.getElementById('timer-toggle-btn').addEventListener('click', (e) => {
    e.preventDefault();
    if (!editingTaskId) return;

    const task = getTaskById(editingTaskId);
    if (!task) return;

    if (task.isTimerRunning) {
      stopTimer(editingTaskId);
    } else {
      startTimer(editingTaskId);
    }

    updateTimerDisplay(editingTaskId);
  });

  // Enterキーで保存（タイトル入力時）
  titleInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && titleInput.value.trim()) {
      saveTask();
    }
  });

  // クイック入力
  const quickInput = document.getElementById('quick-add-input');
  const quickDuration = document.getElementById('quick-add-duration');
  const quickDateBtn = document.getElementById('quick-date-btn');
  const quickDateInput = document.getElementById('quick-add-date');

  // カレンダーボタンのクリック
  quickDateBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (quickDateInput.style.display === 'none') {
      quickDateInput.style.display = 'block';
      quickDateInput.showPicker();
    } else {
      quickDateInput.style.display = 'none';
    }
  });

  // 日時選択時
  quickDateInput.addEventListener('change', () => {
    if (quickDateInput.value) {
      quickDateBtn.classList.add('has-date');
    } else {
      quickDateBtn.classList.remove('has-date');
    }
  });

  // 日時入力欄の外側クリックで閉じる
  document.addEventListener('click', (e) => {
    if (!quickDateInput.contains(e.target) && !quickDateBtn.contains(e.target)) {
      quickDateInput.style.display = 'none';
    }
  });

  quickInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && quickInput.value.trim()) {
      const title = quickInput.value.trim();
      const duration = quickDuration.value ? parseInt(quickDuration.value) : null;

      // デフォルト18:00を設定
      let dueDate = null;
      if (quickDateInput.value) {
        const dateValue = quickDateInput.value;
        // 時刻が含まれていない場合は18:00を追加
        const dateTimeStr = dateValue.includes('T') ? dateValue : `${dateValue}T18:00`;
        dueDate = new Date(dateTimeStr).toISOString();
      }

      createTask(title, '', dueDate, null, false, duration);
      quickInput.value = '';
      quickDuration.value = '';
      quickDateInput.value = '';
      quickDateInput.style.display = 'none';
      quickDateBtn.classList.remove('has-date');
      renderTasks();
    }
  });

  // サブタスク追加ボタン
  document.getElementById('add-subtask-btn').addEventListener('click', () => {
    addSubtask();
  });
}

// ========================================
// タブ切り替え
// ========================================
function switchTab(tabName) {
  currentTab = tabName;

  // タブボタンの状態更新
  document.querySelectorAll('.tab-button').forEach(btn => {
    if (btn.dataset.tab === tabName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // タブコンテンツの表示切り替え
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  document.getElementById(tabName + '-tab').classList.add('active');

  // FABの表示制御（ゴミ箱タブでは非表示）
  const fab = document.getElementById('create-task-btn');
  if (tabName === 'trash') {
    fab.style.display = 'none';
  } else {
    fab.style.display = 'flex';
  }
}
