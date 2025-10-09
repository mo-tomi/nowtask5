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
  const quickDateBtn = document.getElementById('quick-date-btn');
  const quickDateInput = document.getElementById('quick-add-date');
  const quickHistoryBtn = document.getElementById('quick-history-btn');
  const quickHistorySelect = document.getElementById('quick-add-history');

  // 履歴ボタンのクリック
  if (quickHistoryBtn) {
    quickHistoryBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (quickHistorySelect.style.display === 'none') {
        quickHistorySelect.style.display = 'block';
        quickHistorySelect.focus();
      } else {
        quickHistorySelect.style.display = 'none';
      }
    });
  }

  // カレンダーボタンのクリック
  quickDateBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
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
    if (quickHistorySelect && !quickHistorySelect.contains(e.target) &&
        quickHistoryBtn && !quickHistoryBtn.contains(e.target)) {
      quickHistorySelect.style.display = 'none';
    }
  });

  // 履歴選択時に使う時間情報を保持
  let selectedHistoryTime = { startTime: null, endTime: null };

  quickAddForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (quickInput.value.trim()) {
      const title = quickInput.value.trim();

      // デフォルト18:00を設定
      let dueDate = null;
      if (quickDateInput.value) {
        const dateValue = quickDateInput.value;
        // 時刻が含まれていない場合は18:00を追加
        const dateTimeStr = dateValue.includes('T') ? dateValue : `${dateValue}T18:00`;
        dueDate = new Date(dateTimeStr).toISOString();
      }

      // 新規タスク作成（履歴から取得した時間情報を使用）
      const tasks = getTasks();
      const now = new Date().toISOString();
      const task = {
        id: generateUUID(),
        title: title,
        memo: '',
        dueDate: dueDate,
        isCompleted: false,
        createdAt: now,
        updatedAt: now,
        parentId: null,
        isTutorial: false,
        totalTime: 0,
        isTimerRunning: false,
        timerStartTime: null,
        duration: null,
        startTime: selectedHistoryTime.startTime,
        endTime: selectedHistoryTime.endTime,
        urgent: false,
        priority: ''
      };
      tasks.unshift(task);
      saveTasks(tasks);

      // 履歴に追加
      if (typeof addToTaskHistory === 'function') {
        addToTaskHistory(task.title, task.startTime, task.endTime, 20);
        try {
          document.dispatchEvent(new CustomEvent('task:history:updated'));
        } catch (e) {
          console.warn('CustomEvent dispatch failed', e);
        }
      }

      quickInput.value = '';
      selectedHistoryTime = { startTime: null, endTime: null };
      // 履歴セレクトを先頭表示に戻す
      if (quickHistorySelect) quickHistorySelect.selectedIndex = 0;
      quickDateInput.value = '';
      quickDateInput.style.display = 'none';
      quickDateBtn.classList.remove('has-date');
      renderTasks();
    }
  });

  // ---- 履歴セレクトの初期化とイベント ----
  function renderQuickHistory() {
    if (!quickHistorySelect) return;
    quickHistorySelect.innerHTML = '';

    // プレースホルダーを新規作成して追加
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = '履歴から選択';
    quickHistorySelect.appendChild(placeholder);

    // getTaskHistory は core.js にて実装
    const history = typeof getTaskHistory === 'function' ? getTaskHistory(20) : [];
    history.forEach((item, index) => {
      const opt = document.createElement('option');
      // 履歴データは { title, startTime, endTime } または 文字列の可能性がある
      const itemTitle = typeof item === 'string' ? item : (item.title || '');
      opt.value = index; // インデックスを値として保存
      opt.textContent = itemTitle;
      quickHistorySelect.appendChild(opt);
    });
  }

  if (quickHistorySelect) {
    // 初期描画
    renderQuickHistory();

    // 履歴選択時に入力欄へ自動入力＆時間情報を保持
    quickHistorySelect.addEventListener('change', (e) => {
      const index = parseInt(e.target.value);
      if (!isNaN(index)) {
        const history = typeof getTaskHistory === 'function' ? getTaskHistory(20) : [];
        const item = history[index];
        if (item) {
          const itemTitle = typeof item === 'string' ? item : (item.title || '');
          const itemStartTime = typeof item === 'object' ? item.startTime : null;
          const itemEndTime = typeof item === 'object' ? item.endTime : null;

          quickInput.value = itemTitle;
          selectedHistoryTime = {
            startTime: itemStartTime,
            endTime: itemEndTime
          };

          // フォーカスを入力欄に移す
          quickInput.focus();
          quickHistorySelect.style.display = 'none';
        }
      }
    });

    // 履歴はタスク作成時に更新されるため、カスタムイベントで再描画
    document.addEventListener('task:history:updated', () => {
      renderQuickHistory();
    });
  }
  
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
