// ========================================
// UI更新関数
// ========================================

// グローバル変数（インライン追加中のタスク）
let addingSubtaskForTaskId = null;

// タスクリスト表示
function renderTasks() {
  const tasks = getTasks();
  const trash = loadFromStorage(STORAGE_KEYS.TRASH, []);

  const activeTasks = tasks.filter(t => !t.isCompleted && !t.parentId);
  const completedTasks = tasks.filter(t => t.isCompleted && !t.parentId);

  // タスクタブ
  const tasksList = document.getElementById('tasks-list');
  const tasksEmpty = document.getElementById('tasks-empty');
  tasksList.innerHTML = '';

  if (activeTasks.length === 0) {
    tasksEmpty.classList.add('show');
  } else {
    tasksEmpty.classList.remove('show');
    activeTasks.forEach(task => {
      renderTaskWithSubtasks(task, tasksList, false);
    });
  }

  // 完了済みセクション
  const completedList = document.getElementById('completed-list');
  const completedCount = document.getElementById('completed-count');
  const completedSection = document.getElementById('completed-section');
  completedList.innerHTML = '';

  // 完了済みタスクの総数を計算
  let totalCompleted = completedTasks.length;
  completedTasks.forEach(task => {
    const subtasks = getSubtasks(task.id);
    totalCompleted += subtasks.filter(st => st.isCompleted).length;
  });

  if (totalCompleted === 0) {
    completedSection.style.display = 'none';
  } else {
    completedSection.style.display = 'block';
    completedCount.textContent = `(${totalCompleted})`;

    completedTasks.forEach(task => {
      renderTaskWithSubtasks(task, completedList, true);
    });
  }

  // ゴミ箱タブ
  const trashList = document.getElementById('trash-list');
  const trashEmpty = document.getElementById('trash-empty');
  trashList.innerHTML = '';

  if (trash.length === 0) {
    trashEmpty.classList.add('show');
  } else {
    trashEmpty.classList.remove('show');
    trash.forEach(task => {
      trashList.appendChild(createTrashElement(task));
    });
  }

  // 24時間ゲージ更新
  updateTimeGauge();
}

// タスクとサブタスクを再帰的にレンダリング
function renderTaskWithSubtasks(task, container, isCompletedSection) {
  const level = getTaskLevel(task.id);

  // タスク要素を作成
  container.appendChild(createTaskElement(task, level));

  // サブタスクを再帰的に表示
  const subtasks = getSubtasks(task.id);
  subtasks.forEach(subtask => {
    // 完了状態によってフィルタリング
    if (isCompletedSection) {
      if (subtask.isCompleted) {
        renderTaskWithSubtasks(subtask, container, true);
      }
    } else {
      if (!subtask.isCompleted) {
        renderTaskWithSubtasks(subtask, container, false);
      }
    }
  });

  // インライン入力中の場合
  if (addingSubtaskForTaskId === task.id) {
    const inputDiv = createSubtaskInputInline(task.id, level);
    container.appendChild(inputDiv);
  }
}

// タスク要素作成
function createTaskElement(task, level = 0) {
  const div = document.createElement('div');
  div.className = 'task-item' + (task.isCompleted ? ' completed' : '') + (task.isTutorial ? ' tutorial' : '');
  if (level > 0) {
    div.classList.add('subtask');
    div.classList.add(`level-${level}`);
  }
  div.dataset.id = task.id;
  div.dataset.level = level;

  // チェックボックス
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'task-checkbox';
  checkbox.checked = task.isCompleted;
  checkbox.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleTaskCompletion(task.id);
  });

  // コンテンツ部分
  const content = document.createElement('div');
  content.className = 'task-content';

  const title = document.createElement('div');
  title.className = 'task-title';
  title.textContent = task.title;
  content.appendChild(title);

  // メタ情報
  const meta = document.createElement('div');
  meta.className = 'task-meta';

  // サブタスク数表示（子タスクを持つ場合）
  const subtasks = getSubtasks(task.id);
  if (subtasks.length > 0) {
    const subtaskCount = document.createElement('span');
    subtaskCount.className = 'subtask-count';
    const completedCount = subtasks.filter(st => st.isCompleted).length;
    subtaskCount.textContent = `📋 ${completedCount}/${subtasks.length}`;
    meta.appendChild(subtaskCount);
  }

  // 所要時間表示
  if (task.duration) {
    const durationSpan = document.createElement('span');
    durationSpan.className = 'task-duration';
    const hours = Math.floor(task.duration / 60);
    const minutes = task.duration % 60;
    if (hours > 0) {
      durationSpan.textContent = minutes > 0 ? `⏰ ${hours}時間${minutes}分` : `⏰ ${hours}時間`;
    } else {
      durationSpan.textContent = `⏰ ${minutes}分`;
    }
    meta.appendChild(durationSpan);
  }

  if (task.dueDate) {
    const dueDate = document.createElement('span');
    dueDate.className = 'task-due-date';
    if (isOverdue(task.dueDate) && !task.isCompleted) {
      dueDate.classList.add('overdue');
    }
    dueDate.textContent = '📅 ' + formatDateTime(task.dueDate);
    meta.appendChild(dueDate);
  }

  if (task.totalTime > 0 || task.isTimerRunning) {
    const timer = document.createElement('span');
    timer.className = 'task-timer';
    if (task.isTimerRunning) {
      timer.classList.add('running');
    }

    let displayTime = task.totalTime;
    if (task.isTimerRunning && task.timerStartTime) {
      const startTime = new Date(task.timerStartTime);
      const now = new Date();
      const elapsedSeconds = Math.floor((now - startTime) / 1000);
      displayTime = task.totalTime + elapsedSeconds;
    }

    timer.textContent = '⏱️ ' + formatTime(displayTime);
    meta.appendChild(timer);
  }

  if (meta.children.length > 0) {
    content.appendChild(meta);
  }

  if (task.memo) {
    const memo = document.createElement('div');
    memo.className = 'task-memo';
    memo.textContent = task.memo.substring(0, 100) + (task.memo.length > 100 ? '...' : '');
    content.appendChild(memo);
  }

  div.appendChild(checkbox);
  div.appendChild(content);

  // サブタスク追加ボタン（タスク内に表示）
  if (!task.isCompleted && canHaveSubtask(task.id)) {
    const addSubtaskIcon = document.createElement('button');
    addSubtaskIcon.className = 'add-subtask-icon';
    addSubtaskIcon.innerHTML = '+';
    addSubtaskIcon.title = 'サブタスクを追加';
    addSubtaskIcon.addEventListener('click', (e) => {
      e.stopPropagation();
      addingSubtaskForTaskId = task.id;
      renderTasks();
    });
    div.appendChild(addSubtaskIcon);
  }

  // クリックで編集
  div.addEventListener('click', () => {
    openEditModal(task.id);
  });

  return div;
}

// ゴミ箱要素作成
function createTrashElement(task) {
  const div = document.createElement('div');
  div.className = 'task-item';
  div.dataset.id = task.id;

  const content = document.createElement('div');
  content.className = 'task-content';

  const title = document.createElement('div');
  title.className = 'task-title';
  title.textContent = task.title;
  content.appendChild(title);

  const meta = document.createElement('div');
  meta.className = 'task-meta';
  meta.textContent = '削除日: ' + formatDateTime(task.deletedAt);
  content.appendChild(meta);

  if (task.memo) {
    const memo = document.createElement('div');
    memo.className = 'task-memo';
    memo.textContent = task.memo.substring(0, 100) + (task.memo.length > 100 ? '...' : '');
    content.appendChild(memo);
  }

  div.appendChild(content);

  // アクション部分
  const actions = document.createElement('div');
  actions.className = 'task-actions';

  const restoreBtn = document.createElement('button');
  restoreBtn.className = 'icon-btn restore';
  restoreBtn.innerHTML = '↩️';
  restoreBtn.title = '復元';
  restoreBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    confirmAction('このタスクを復元しますか？', () => {
      restoreTask(task.id);
      renderTasks();
    });
  });

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'icon-btn delete';
  deleteBtn.innerHTML = '🗑️';
  deleteBtn.title = '完全削除';
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    confirmAction('このタスクを完全に削除しますか？\nこの操作は取り消せません。', () => {
      permanentDelete(task.id);
      renderTasks();
    });
  });

  actions.appendChild(restoreBtn);
  actions.appendChild(deleteBtn);
  div.appendChild(actions);

  return div;
}

// サブタスク追加ボタン作成
function createAddSubtaskButton(parentId, parentLevel = 0) {
  const btn = document.createElement('button');
  btn.className = 'add-subtask-btn';
  btn.classList.add(`level-${parentLevel + 1}`);
  btn.innerHTML = '+ サブタスクを追加';
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    addingSubtaskForTaskId = parentId;
    renderTasks();
  });
  return btn;
}

// インラインサブタスク入力作成
function createSubtaskInputInline(parentId, parentLevel = 0) {
  const div = document.createElement('div');
  div.className = 'subtask-input-inline';
  div.classList.add(`level-${parentLevel + 1}`);

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'サブタスク名を入力';
  input.maxLength = 100;

  const saveInlineSubtask = () => {
    const title = input.value.trim();
    if (title) {
      createTask(title, '', null, parentId);
    }
    addingSubtaskForTaskId = null;
    renderTasks();
  };

  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      saveInlineSubtask();
    }
  });

  input.addEventListener('blur', () => {
    setTimeout(() => {
      addingSubtaskForTaskId = null;
      renderTasks();
    }, 200);
  });

  div.appendChild(input);

  // 自動フォーカス
  setTimeout(() => input.focus(), 0);

  return div;
}

// ========================================
// モーダル管理
// ========================================

// 新規作成モーダルを開く
function openCreateModal() {
  editingTaskId = null;

  document.getElementById('modal-title').textContent = '新規タスク';
  document.getElementById('task-title').value = '';
  document.getElementById('task-memo').value = '';
  document.getElementById('task-due-date').value = '';
  document.getElementById('title-char-count').textContent = '0';
  document.getElementById('delete-btn').style.display = 'none';
  document.getElementById('timer-section').style.display = 'none';
  document.getElementById('subtasks-section').style.display = 'none';
  document.getElementById('save-btn').disabled = true;

  document.getElementById('task-modal').classList.add('show');
  document.getElementById('task-title').focus();
}

// 編集モーダルを開く
function openEditModal(id) {
  const task = getTaskById(id);
  if (!task) return;

  editingTaskId = id;

  document.getElementById('modal-title').textContent = 'タスク編集';
  document.getElementById('task-title').value = task.title;
  document.getElementById('task-memo').value = task.memo;
  document.getElementById('title-char-count').textContent = task.title.length;

  if (task.dueDate) {
    // ISO形式をdatetime-local形式に変換
    const date = new Date(task.dueDate);
    const localISO = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    document.getElementById('task-due-date').value = localISO;
  } else {
    document.getElementById('task-due-date').value = '';
  }

  document.getElementById('delete-btn').style.display = 'inline-block';
  document.getElementById('timer-section').style.display = 'block';
  document.getElementById('subtasks-section').style.display = 'block';
  document.getElementById('save-btn').disabled = false;

  // サブタスクリスト表示
  editingSubtasks = getSubtasks(id);
  renderSubtasksList();

  // タイマー表示更新
  updateTimerDisplay(id);

  // タイマー更新インターバル設定
  if (timerInterval) {
    clearInterval(timerInterval);
  }
  timerInterval = setInterval(() => {
    if (editingTaskId) {
      updateTimerDisplay(editingTaskId);
    }
  }, 1000);

  document.getElementById('task-modal').classList.add('show');
  document.getElementById('task-title').focus();
}

// モーダルを閉じる
function closeModal() {
  document.getElementById('task-modal').classList.remove('show');
  editingTaskId = null;
  editingSubtasks = [];

  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

// サブタスクリスト表示
function renderSubtasksList() {
  const container = document.getElementById('subtasks-list');
  container.innerHTML = '';

  editingSubtasks.forEach((subtask, index) => {
    const item = document.createElement('div');
    item.className = 'subtask-item' + (subtask.isCompleted ? ' completed' : '');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = subtask.isCompleted;
    checkbox.addEventListener('change', () => {
      editingSubtasks[index].isCompleted = checkbox.checked;
      renderSubtasksList();
    });

    // タイトルを編集可能にする
    if (subtask.isEditing) {
      const input = document.createElement('input');
      input.type = 'text';
      input.value = subtask.title || '';
      input.className = 'subtask-input';
      input.maxLength = 100;
      input.placeholder = 'サブタスク名を入力';

      input.addEventListener('blur', () => {
        if (input.value.trim()) {
          editingSubtasks[index].title = input.value.trim();
          editingSubtasks[index].isEditing = false;
          renderSubtasksList();
        } else {
          // 空の場合は削除
          editingSubtasks.splice(index, 1);
          renderSubtasksList();
        }
      });

      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          input.blur();
        }
      });

      item.appendChild(checkbox);
      item.appendChild(input);
      container.appendChild(item);

      // 自動フォーカス
      setTimeout(() => input.focus(), 0);
    } else {
      const title = document.createElement('span');
      title.textContent = subtask.title;

      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = '×';
      deleteBtn.addEventListener('click', () => {
        editingSubtasks.splice(index, 1);
        renderSubtasksList();
      });

      item.appendChild(checkbox);
      item.appendChild(title);
      item.appendChild(deleteBtn);
      container.appendChild(item);
    }
  });
}

// サブタスク追加
function addSubtask() {
  const subtask = {
    id: generateUUID(),
    title: '',
    memo: '',
    dueDate: null,
    isCompleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    parentId: editingTaskId,
    isTutorial: false,
    totalTime: 0,
    isTimerRunning: false,
    timerStartTime: null,
    isEditing: true
  };

  editingSubtasks.push(subtask);
  renderSubtasksList();
}

// タスク保存
function saveTask() {
  const title = document.getElementById('task-title').value.trim();
  if (!title) {
    alert('タスク名を入力してください');
    return;
  }

  const memo = document.getElementById('task-memo').value.trim();
  const dueDateInput = document.getElementById('task-due-date').value;

  let dueDate = null;
  if (dueDateInput) {
    dueDate = new Date(dueDateInput).toISOString();
  }

  if (editingTaskId) {
    // 更新
    updateTask(editingTaskId, { title, memo, dueDate });

    // サブタスク保存
    const tasks = getTasks();
    const existingSubtaskIds = getSubtasks(editingTaskId).map(st => st.id);

    // 削除されたサブタスクを処理
    existingSubtaskIds.forEach(id => {
      if (!editingSubtasks.find(st => st.id === id)) {
        deleteTask(id);
      }
    });

    // サブタスクを保存
    editingSubtasks.forEach(subtask => {
      const existingTask = getTaskById(subtask.id);
      if (existingTask) {
        updateTask(subtask.id, subtask);
      } else {
        const newTasks = getTasks();
        newTasks.unshift(subtask);
        saveTasks(newTasks);
      }
    });
  } else {
    // 新規作成
    createTask(title, memo, dueDate);
  }

  closeModal();
  renderTasks();
}

// タスク削除
function deleteCurrentTask() {
  if (!editingTaskId) return;

  confirmAction('このタスクを削除しますか？', () => {
    deleteTask(editingTaskId);
    closeModal();
    renderTasks();
  });
}

// 確認ダイアログ
function confirmAction(message, callback) {
  document.getElementById('confirm-message').textContent = message;
  document.getElementById('confirm-modal').classList.add('show');

  const okBtn = document.getElementById('confirm-ok-btn');
  const cancelBtn = document.getElementById('confirm-cancel-btn');

  const handleOk = () => {
    document.getElementById('confirm-modal').classList.remove('show');
    callback();
    cleanup();
  };

  const handleCancel = () => {
    document.getElementById('confirm-modal').classList.remove('show');
    cleanup();
  };

  const cleanup = () => {
    okBtn.removeEventListener('click', handleOk);
    cancelBtn.removeEventListener('click', handleCancel);
  };

  okBtn.addEventListener('click', handleOk);
  cancelBtn.addEventListener('click', handleCancel);
}

// ========================================
// 設定モーダル
// ========================================

// 設定モーダルを開く
function openSettingsModal() {
  const routines = getRoutines();

  // 各ルーティンの設定を読み込み
  ['breakfast', 'lunch', 'dinner', 'brush', 'sleep'].forEach(type => {
    const routine = routines[type];
    const checkbox = document.getElementById(`routine-${type}-enabled`);
    const durationSelect = document.getElementById(`routine-${type}-duration`);

    if (routine && routine.enabled) {
      checkbox.checked = true;
      durationSelect.value = routine.duration;
    } else {
      checkbox.checked = false;
    }
  });

  document.getElementById('settings-modal').classList.add('show');
}

// 設定モーダルを閉じる
function closeSettingsModal() {
  document.getElementById('settings-modal').classList.remove('show');
}

// 設定を保存
function saveSettings() {
  const routines = {};

  ['breakfast', 'lunch', 'dinner', 'brush', 'sleep'].forEach(type => {
    const enabled = document.getElementById(`routine-${type}-enabled`).checked;
    const duration = parseInt(document.getElementById(`routine-${type}-duration`).value);

    routines[type] = {
      enabled: enabled,
      duration: duration
    };
  });

  saveRoutines(routines);
  closeSettingsModal();

  // ルーティンタスクを作成
  createDailyRoutineTasks();
  renderTasks();
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
      const dueDate = quickDateInput.value ? new Date(quickDateInput.value).toISOString() : null;

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
// 24時間ゲージ
// ========================================

// 24時間ゲージ更新
function updateTimeGauge() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();

  // 現在時刻表示
  document.getElementById('current-time').textContent =
    `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

  // 経過時間のパーセンテージ（0:00からの経過）
  const minutesFromMidnight = hours * 60 + minutes;
  const percentElapsed = (minutesFromMidnight / (24 * 60)) * 100;

  // 経過ゲージ更新
  const elapsedBar = document.getElementById('time-gauge-elapsed');
  elapsedBar.style.width = `${percentElapsed}%`;

  // 現在時刻マーカー位置更新
  const marker = document.getElementById('time-marker');
  marker.style.left = `${percentElapsed}%`;

  // 今日の予定時間更新
  updateScheduledTasks();
}

// 今日の予定タスク時間を表示
function updateScheduledTasks() {
  const tasks = getTasks();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // 今日の期限があるタスク、または期限はないが所要時間が設定されている未完了タスクを抽出
  const todayTasks = tasks.filter(task => {
    if (task.isCompleted) return false;

    // 期限がある場合は今日の範囲内かチェック
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      return dueDate >= today && dueDate < tomorrow;
    }

    // 期限はないが所要時間が設定されている場合も含める
    return task.duration && task.duration > 0;
  });

  if (todayTasks.length === 0) {
    document.getElementById('time-gauge-scheduled').style.display = 'none';
    return;
  }

  // タスクの所要時間の合計を計算（分単位）
  const totalDurationMinutes = todayTasks.reduce((sum, task) => {
    return sum + (task.duration || 0);
  }, 0);

  if (totalDurationMinutes === 0) {
    document.getElementById('time-gauge-scheduled').style.display = 'none';
    return;
  }

  // 現在時刻から開始して、合計所要時間分のゲージを表示
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // ゲージの開始位置と幅を計算
  const startPercent = (currentMinutes / (24 * 60)) * 100;
  const durationPercent = (totalDurationMinutes / (24 * 60)) * 100;

  // 予定ゲージ更新
  const scheduledBar = document.getElementById('time-gauge-scheduled');
  scheduledBar.style.display = 'block';
  scheduledBar.style.left = `${startPercent}%`;
  scheduledBar.style.width = `${Math.min(durationPercent, 100 - startPercent)}%`; // 24時間を超えないように

  // 残りタスク時間を表示
  const remainingElement = document.getElementById('remaining-tasks');
  const hours = Math.floor(totalDurationMinutes / 60);
  const minutes = totalDurationMinutes % 60;

  if (hours > 0) {
    if (minutes > 0) {
      remainingElement.textContent = `残り: ${hours}時間${minutes}分`;
    } else {
      remainingElement.textContent = `残り: ${hours}時間`;
    }
  } else if (minutes > 0) {
    remainingElement.textContent = `残り: ${minutes}分`;
  } else {
    remainingElement.textContent = '残り: 0分';
  }
}

// ========================================
// 初期化
// ========================================
function init() {
  // チュートリアル初期化
  initTutorial();

  // ゴミ箱クリーンアップ
  cleanupTrash();

  // デイリールーティンタスク作成
  createDailyRoutineTasks();

  // イベントリスナー設定
  initEventListeners();

  // 初回レンダリング
  renderTasks();

  // 24時間ゲージの初期化と更新
  updateTimeGauge();
  setInterval(updateTimeGauge, 60000); // 1分ごとに更新

  // 1秒ごとにタスクリストを更新（タイマー表示のため）
  setInterval(() => {
    const tasks = getTasks();
    const hasRunningTimer = tasks.some(t => t.isTimerRunning);
    if (hasRunningTimer) {
      renderTasks();
    }
  }, 1000);
}

// DOMロード後に初期化実行
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
