// ========================================
// 定数定義
// ========================================
const STORAGE_KEYS = {
  TASKS: 'nowtask_tasks',
  TRASH: 'nowtask_trash',
  SETTINGS: 'nowtask_settings'
};

const TRASH_RETENTION_DAYS = 30;

// ========================================
// グローバル変数
// ========================================
let currentTab = 'tasks';
let editingTaskId = null;
let timerInterval = null;
let editingSubtasks = [];

// ========================================
// ユーティリティ関数
// ========================================

// UUID生成
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// localStorage保存
function saveToStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      alert('ストレージ容量不足です');
    } else {
      console.error('保存エラー:', e);
    }
    return false;
  }
}

// localStorage読み込み
function loadFromStorage(key, defaultValue = []) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (e) {
    console.error('読み込みエラー:', e);
    return defaultValue;
  }
}

// 日時フォーマット
function formatDateTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${month}/${day} ${hours}:${minutes}`;
}

// 期限切れチェック
function isOverdue(dueDate) {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

// 時間フォーマット（秒 → HH:MM:SS）
function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ========================================
// タスク管理関数
// ========================================

// タスク取得
function getTasks() {
  return loadFromStorage(STORAGE_KEYS.TASKS, []);
}

// タスク保存
function saveTasks(tasks) {
  return saveToStorage(STORAGE_KEYS.TASKS, tasks);
}

// ID指定でタスク取得
function getTaskById(id) {
  const tasks = getTasks();
  return tasks.find(task => task.id === id);
}

// 子タスク取得
function getSubtasks(parentId) {
  const tasks = getTasks();
  return tasks.filter(task => task.parentId === parentId);
}

// タスク作成
function createTask(title, memo = '', dueDate = null, parentId = null, isTutorial = false) {
  if (!title || title.trim().length === 0) {
    return null;
  }

  const now = new Date().toISOString();
  const task = {
    id: generateUUID(),
    title: title.trim(),
    memo: memo.trim(),
    dueDate: dueDate,
    isCompleted: false,
    createdAt: now,
    updatedAt: now,
    parentId: parentId,
    isTutorial: isTutorial,
    totalTime: 0,
    isTimerRunning: false,
    timerStartTime: null
  };

  const tasks = getTasks();
  tasks.unshift(task);
  saveTasks(tasks);
  return task;
}

// タスク更新
function updateTask(id, updates) {
  const tasks = getTasks();
  const index = tasks.findIndex(task => task.id === id);

  if (index === -1) return false;

  tasks[index] = {
    ...tasks[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  saveTasks(tasks);
  return true;
}

// タスク削除（ゴミ箱へ移動）
function deleteTask(id) {
  const tasks = getTasks();
  const index = tasks.findIndex(task => task.id === id);

  if (index === -1) return false;

  const deletedTask = tasks.splice(index, 1)[0];

  // ゴミ箱に追加
  const trash = loadFromStorage(STORAGE_KEYS.TRASH, []);
  trash.unshift({
    ...deletedTask,
    deletedAt: new Date().toISOString()
  });
  saveToStorage(STORAGE_KEYS.TRASH, trash);

  saveTasks(tasks);
  return true;
}

// タスク復元
function restoreTask(id) {
  const trash = loadFromStorage(STORAGE_KEYS.TRASH, []);
  const index = trash.findIndex(task => task.id === id);

  if (index === -1) return false;

  const restoredTask = trash.splice(index, 1)[0];
  delete restoredTask.deletedAt;

  const tasks = getTasks();
  tasks.unshift(restoredTask);

  saveToStorage(STORAGE_KEYS.TRASH, trash);
  saveTasks(tasks);
  return true;
}

// ゴミ箱から完全削除
function permanentDelete(id) {
  const trash = loadFromStorage(STORAGE_KEYS.TRASH, []);
  const filtered = trash.filter(task => task.id !== id);
  saveToStorage(STORAGE_KEYS.TRASH, filtered);
  return true;
}

// ゴミ箱クリーンアップ（30日以上経過したタスクを削除）
function cleanupTrash() {
  const trash = loadFromStorage(STORAGE_KEYS.TRASH, []);
  const now = new Date();
  const cutoffDate = new Date(now.getTime() - TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000);

  const filtered = trash.filter(task => {
    return new Date(task.deletedAt) > cutoffDate;
  });

  saveToStorage(STORAGE_KEYS.TRASH, filtered);
}

// ========================================
// チュートリアル
// ========================================
function initTutorial() {
  const tasks = getTasks();

  // 既にタスクがある場合はチュートリアルをスキップ
  if (tasks.length > 0) return;

  const tutorialTasks = [
    {
      title: 'nowtaskへようこそ！',
      memo: 'このアプリでタスクを管理しましょう。\nまずはこのチュートリアルを進めてください。'
    },
    {
      title: 'タスクをタップして詳細を確認',
      memo: 'タスクをクリックすると、詳細を編集できます。'
    },
    {
      title: 'チェックボックスで完了/未完了を切り替え',
      memo: '完了したタスクは「完了済み」タブで確認できます。'
    },
    {
      title: '期限を設定してみよう',
      memo: 'タスクに期限を設定すると、期限切れの場合は赤く表示されます。',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      title: 'タスクを削除してみよう',
      memo: 'タスクを開いて削除ボタンを押すと、ゴミ箱に移動します。'
    },
    {
      title: '右下の＋ボタンで新規タスク作成',
      memo: 'チュートリアルを完了したら、自分のタスクを作成してみましょう！'
    }
  ];

  tutorialTasks.forEach((taskData, index) => {
    createTask(
      taskData.title,
      taskData.memo,
      taskData.dueDate || null,
      null,
      true
    );
  });
}

// ========================================
// タイマー機能
// ========================================

// タイマー開始
function startTimer(taskId) {
  const task = getTaskById(taskId);
  if (!task || task.isTimerRunning) return false;

  updateTask(taskId, {
    isTimerRunning: true,
    timerStartTime: new Date().toISOString()
  });

  return true;
}

// タイマー停止
function stopTimer(taskId) {
  const task = getTaskById(taskId);
  if (!task || !task.isTimerRunning) return false;

  const startTime = new Date(task.timerStartTime);
  const now = new Date();
  const elapsedSeconds = Math.floor((now - startTime) / 1000);

  updateTask(taskId, {
    isTimerRunning: false,
    timerStartTime: null,
    totalTime: task.totalTime + elapsedSeconds
  });

  return true;
}

// タイマー表示更新
function updateTimerDisplay(taskId) {
  const task = getTaskById(taskId);
  if (!task) return;

  let displayTime = task.totalTime;

  if (task.isTimerRunning && task.timerStartTime) {
    const startTime = new Date(task.timerStartTime);
    const now = new Date();
    const elapsedSeconds = Math.floor((now - startTime) / 1000);
    displayTime = task.totalTime + elapsedSeconds;
  }

  const timerDisplay = document.getElementById('timer-display');
  if (timerDisplay) {
    timerDisplay.textContent = formatTime(displayTime);
  }

  // タイマーボタンの状態更新
  const timerBtn = document.getElementById('timer-toggle-btn');
  if (timerBtn) {
    if (task.isTimerRunning) {
      timerBtn.textContent = '停止';
      timerBtn.classList.add('running');
    } else {
      timerBtn.textContent = '開始';
      timerBtn.classList.remove('running');
    }
  }
}

// ========================================
// UI更新関数
// ========================================

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
      tasksList.appendChild(createTaskElement(task));
      // サブタスク表示
      const subtasks = getSubtasks(task.id);
      subtasks.forEach(subtask => {
        if (!subtask.isCompleted) {
          tasksList.appendChild(createTaskElement(subtask, true));
        }
      });
    });
  }

  // 完了済みタブ
  const completedList = document.getElementById('completed-list');
  const completedEmpty = document.getElementById('completed-empty');
  completedList.innerHTML = '';

  if (completedTasks.length === 0) {
    completedEmpty.classList.add('show');
  } else {
    completedEmpty.classList.remove('show');
    completedTasks.forEach(task => {
      completedList.appendChild(createTaskElement(task));
      // 完了済みサブタスク表示
      const subtasks = getSubtasks(task.id);
      subtasks.forEach(subtask => {
        if (subtask.isCompleted) {
          completedList.appendChild(createTaskElement(subtask, true));
        }
      });
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
}

// タスク要素作成
function createTaskElement(task, isSubtask = false) {
  const div = document.createElement('div');
  div.className = 'task-item' + (task.isCompleted ? ' completed' : '') + (task.isTutorial ? ' tutorial' : '') + (isSubtask ? ' subtask' : '');
  div.dataset.id = task.id;

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

  // サブタスク数表示
  if (!isSubtask) {
    const subtasks = getSubtasks(task.id);
    if (subtasks.length > 0) {
      const subtaskCount = document.createElement('span');
      subtaskCount.className = 'subtask-count';
      const completedCount = subtasks.filter(st => st.isCompleted).length;
      subtaskCount.textContent = `📋 ${completedCount}/${subtasks.length}`;
      meta.appendChild(subtaskCount);
    }
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

// 完了/未完了切り替え
function toggleTaskCompletion(id) {
  const task = getTaskById(id);
  if (!task) return;

  // タイマー実行中の場合は停止
  if (task.isTimerRunning) {
    stopTimer(id);
  }

  updateTask(id, { isCompleted: !task.isCompleted });
  renderTasks();
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
  quickInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && quickInput.value.trim()) {
      const title = quickInput.value.trim();
      createTask(title);
      quickInput.value = '';
      renderTasks();
    }
  });

  // サブタスク追加ボタン
  document.getElementById('add-subtask-btn').addEventListener('click', () => {
    addSubtask();
  });
}

// ========================================
// 初期化
// ========================================
function init() {
  // チュートリアル初期化
  initTutorial();

  // ゴミ箱クリーンアップ
  cleanupTrash();

  // イベントリスナー設定
  initEventListeners();

  // 初回レンダリング
  renderTasks();

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
