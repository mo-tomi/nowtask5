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

// タスクの階層レベルを取得（最大5階層）
function getTaskLevel(taskId) {
  let level = 0;
  let currentId = taskId;
  const maxLevel = 5;

  while (level < maxLevel) {
    const task = getTaskById(currentId);
    if (!task || !task.parentId) break;
    level++;
    currentId = task.parentId;
  }

  return level;
}

// タスクが子タスクを持てるかチェック（5階層制限）
function canHaveSubtask(taskId) {
  return getTaskLevel(taskId) < 4; // 0-4まで（5階層）
}

// タスク作成
function createTask(title, memo = '', dueDate = null, parentId = null, isTutorial = false, duration = null) {
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
    timerStartTime: null,
    duration: duration // 所要時間（分）
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

// 完了/未完了切り替え
function toggleTaskCompletion(id) {
  const task = getTaskById(id);
  if (!task) return;

  // タイマー実行中の場合は停止
  if (task.isTimerRunning) {
    stopTimer(id);
  }

  updateTask(id, { isCompleted: !task.isCompleted });

  // アニメーション付きで再レンダリング
  const taskElement = document.querySelector(`[data-task-id="${id}"]`);
  if (taskElement && !task.isCompleted) {
    // 完了にする場合のアニメーション
    taskElement.style.transition = 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
    taskElement.style.opacity = '0.5';
    taskElement.style.transform = 'scale(0.98)';
    setTimeout(() => {
      renderTasks();
    }, 400);
  } else {
    renderTasks();
  }
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
// デイリールーティン
// ========================================

// ルーティン設定取得
function getRoutines() {
  return loadFromStorage(STORAGE_KEYS.ROUTINES, {});
}

// ルーティン設定保存
function saveRoutines(routines) {
  return saveToStorage(STORAGE_KEYS.ROUTINES, routines);
}

// 今日のルーティンタスクを作成
function createDailyRoutineTasks() {
  const routines = getRoutines();
  const tasks = getTasks();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const routineTypes = ['breakfast', 'lunch', 'dinner', 'brush', 'sleep'];

  routineTypes.forEach(type => {
    const routine = routines[type];
    if (!routine || !routine.enabled) return;

    // 今日のこのルーティンタスクが既に存在するかチェック
    const existsToday = tasks.some(task => {
      if (!task.isRoutine || task.routineType !== type) return false;
      const taskDate = new Date(task.createdAt);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === today.getTime();
    });

    if (existsToday) return;

    // ルーティンタスクを作成
    const taskNames = {
      breakfast: '朝食',
      lunch: '昼食',
      dinner: '夕食',
      brush: '歯磨き',
      sleep: '睡眠'
    };

    const task = {
      id: generateUUID(),
      title: taskNames[type],
      memo: '',
      dueDate: null,
      isCompleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      parentId: null,
      isTutorial: false,
      totalTime: 0,
      isTimerRunning: false,
      timerStartTime: null,
      duration: routine.duration,
      isRoutine: true,
      routineType: type
    };

    const allTasks = getTasks();
    allTasks.unshift(task);
    saveTasks(allTasks);
  });
}
