// ========================================
// イベントリスナー設定
// ========================================

function initEventListeners() {
  // ゴミ箱アイコン（タブUIを廃止したため、直接表示切替を行う）
  document.getElementById('trash-icon-btn').addEventListener('click', () => {
    showTrash();
  });

  // 設定アイコン
  function showTasks() {
    document.getElementById('tasks-tab').classList.add('active');
    document.getElementById('trash-tab').classList.remove('active');
    const fab = document.getElementById('create-task-btn');
    if (fab) fab.style.display = 'flex';
  }

  function showTrash() {
    document.getElementById('tasks-tab').classList.remove('active');
    document.getElementById('trash-tab').classList.add('active');
    const fab = document.getElementById('create-task-btn');
    if (fab) fab.style.display = 'none';
  }

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
  const quickAddForm = document.getElementById('quick-add-form');
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

  quickAddForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (quickInput.value.trim()) {
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

  // スクロール連動で24時間ゲージを更新（スロットリング）
  const tasksListContainer = document.querySelector('.main-content');
  if (tasksListContainer) {
    let lastCall = 0;
    const throttleMs = 150;
    tasksListContainer.addEventListener('scroll', () => {
      const now = Date.now();
      if (now - lastCall < throttleMs) return;
      lastCall = now;

      // 画面上部に見える最初の date-separator を探す
      const separators = document.querySelectorAll('.date-separator');
      let topMostDate = null;
      let topMostOffset = Infinity;
      separators.forEach(sep => {
        const rect = sep.getBoundingClientRect();
        // ビューポート上部付近（ヘッダーなどを考慮して 80px 下）にあるものを検出
        const offset = Math.abs(rect.top - 80);
        if (rect.top <= 120 && offset < topMostOffset) {
          topMostOffset = offset;
          topMostDate = sep.dataset.date || null;
        }
      });

      // 見つかった日付を渡してゲージを更新
      if (topMostDate !== null) {
        updateTimeGauge(topMostDate || undefined);
      }
    });
  }
}

// タブUIは廃止しました。表示切替は showTasks/showTrash を使用します。
