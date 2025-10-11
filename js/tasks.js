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
function createTask(title, memo = '', dueDate = null, parentId = null, isTutorial = false, duration = null, startTime = null, endTime = null) {
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
    duration: duration, // 所要時間（分） - 廃止予定
    startTime: startTime, // 開始時刻 (HH:MM)
    endTime: endTime, // 終了時刻 (HH:MM)
    urgent: false, // 緊急フラグ
    priority: '' // 優先順位 (high, medium, low, '')
  };

  const tasks = getTasks();
  tasks.unshift(task);
  saveTasks(tasks);
  // タスク情報を履歴に追加（core.js の addToTaskHistory を使用）
  if (typeof addToTaskHistory === 'function') {
    addToTaskHistory(task.title, task.startTime, task.endTime, 20);
    // 履歴が更新されたことを通知するカスタムイベント
    try {
      document.dispatchEvent(new CustomEvent('task:history:updated'));
    } catch (e) {
      // 古いブラウザでは CustomEvent が機能しない場合があるが、致命的ではない
      console.warn('CustomEvent dispatch failed for task:history:updated', e);
    }
  }

  // サブタスクの場合、親タスクの時間を集計
  if (parentId && typeof aggregateSubtaskTimes === 'function') {
    aggregateSubtaskTimes(parentId);
  }

  return task;
}

// サブタスクの時間をメインタスクに集計
function aggregateSubtaskTimes(taskId) {
  const task = getTaskById(taskId);
  if (!task) return false;

  // メインタスクに時間が設定されている場合はスキップ
  if (task.startTime || task.endTime) return false;

  const subtasks = getSubtasks(taskId);
  if (subtasks.length === 0) return false;

  // サブタスクの中で時間が設定されているものを探す
  const subtasksWithTime = subtasks.filter(st => st.startTime || st.endTime);
  if (subtasksWithTime.length === 0) return false;

  // 最も早い開始時刻と最も遅い終了時刻を見つける
  let earliestStart = null;
  let latestEnd = null;

  subtasksWithTime.forEach(subtask => {
    if (subtask.startTime) {
      if (!earliestStart || subtask.startTime < earliestStart) {
        earliestStart = subtask.startTime;
      }
    }
    if (subtask.endTime) {
      if (!latestEnd || subtask.endTime > latestEnd) {
        latestEnd = subtask.endTime;
      }
    }
  });

  // メインタスクに時間を設定
  if (earliestStart || latestEnd) {
    updateTask(taskId, {
      startTime: earliestStart,
      endTime: latestEnd
    });
    return true;
  }

  return false;
}

// タスク更新
function updateTask(id, updates) {
  const tasks = getTasks();
  const index = tasks.findIndex(task => task.id === id);

  if (index === -1) return false;

  const task = tasks[index];
  tasks[index] = {
    ...task,
    ...updates,
    updatedAt: new Date().toISOString()
  };

  saveTasks(tasks);

  // サブタスクの場合、親タスクの時間を集計
  if (task.parentId && typeof aggregateSubtaskTimes === 'function') {
    aggregateSubtaskTimes(task.parentId);
  }

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

// タスクを棚上げ
function shelveTask(id) {
  const tasks = getTasks();
  const index = tasks.findIndex(task => task.id === id);

  if (index === -1) return false;

  const shelvedTask = tasks.splice(index, 1)[0];

  // 棚上げリストに追加
  const shelved = loadFromStorage(STORAGE_KEYS.SHELVED, []);
  shelved.unshift({
    ...shelvedTask,
    shelvedAt: new Date().toISOString()
  });
  saveToStorage(STORAGE_KEYS.SHELVED, shelved);

  saveTasks(tasks);
  return true;
}

// 棚上げから復帰
function unshelveTask(id) {
  const shelved = loadFromStorage(STORAGE_KEYS.SHELVED, []);
  const index = shelved.findIndex(task => task.id === id);

  if (index === -1) return false;

  const restoredTask = shelved.splice(index, 1)[0];
  delete restoredTask.shelvedAt;

  const tasks = getTasks();
  tasks.unshift(restoredTask);

  saveToStorage(STORAGE_KEYS.SHELVED, shelved);
  saveTasks(tasks);
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

  const wasCompleted = task.isCompleted;
  updateTask(id, { isCompleted: !task.isCompleted });

  // アニメーション付きで再レンダリング
  const taskElement = document.querySelector(`[data-task-id="${id}"]`);
  if (taskElement && !wasCompleted) {
    // 完了にする場合のアニメーション
    taskElement.style.transition = 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
    taskElement.style.opacity = '0.5';
    taskElement.style.transform = 'scale(0.98)';
    setTimeout(() => {
      renderTasks();
      // 完了後に「元に戻す」ボタンを表示
      showUndoButton(id, task.title);
    }, 400);
  } else {
    renderTasks();
  }
}

// 元に戻すボタンを表示
function showUndoButton(taskId, taskTitle) {
  // 既存の元に戻すボタンを削除
  const existingUndo = document.querySelector('.undo-toast');
  if (existingUndo) {
    existingUndo.remove();
  }

  // 元に戻すトーストを作成
  const toast = document.createElement('div');
  toast.className = 'undo-toast';
  toast.innerHTML = `
    <div class="undo-toast-content">
      <span class="undo-toast-text">「${taskTitle}」を完了しました</span>
      <button class="undo-btn">元に戻す</button>
    </div>
  `;

  document.body.appendChild(toast);

  // ボタンクリックイベント
  const undoBtn = toast.querySelector('.undo-btn');
  undoBtn.addEventListener('click', () => {
    toggleTaskCompletion(taskId);
    toast.remove();
  });

  // アニメーション表示
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  // 5秒後に自動的に非表示
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 5000);
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

// タスク時間記録開始（render.jsから呼び出し用）
function startTaskTimer(taskId) {
  return startTimer(taskId);
}

// タスク時間記録停止（render.jsから呼び出し用）
function stopTaskTimer(taskId) {
  return stopTimer(taskId);
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
  return loadFromStorage(STORAGE_KEYS.ROUTINES, []);
}

// ルーティン設定保存
function saveRoutines(routines) {
  return saveToStorage(STORAGE_KEYS.ROUTINES, routines);
}

// 指定日のルーティンタスクを作成
// targetDate: Date オブジェクト（省略時は今日）
function createDailyRoutineTasks(targetDate) {
  const routines = getRoutines();

  // 配列でない場合（旧形式）はスキップ
  if (!Array.isArray(routines)) {
    console.warn('Routines is not an array, skipping routine task creation');
    return;
  }

  const tasks = getTasks();
  const target = targetDate ? new Date(targetDate) : new Date();
  target.setHours(0, 0, 0, 0);

  routines.forEach((routine, index) => {
    if (!routine || !routine.name || !routine.duration) return;

    // 対象日のこのルーティンタスクが既に存在するかチェック
    const existsOnDate = tasks.some(task => {
      if (!task.isRoutine || task.routineId !== routine.id) return false;
      if (!task.dueDate) return false;
      const taskDueDate = new Date(task.dueDate);
      taskDueDate.setHours(0, 0, 0, 0);
      return taskDueDate.getTime() === target.getTime();
    });

    if (existsOnDate) return;

    // ルーティンタスクを作成
    const targetISO = new Date(target.getTime() - target.getTimezoneOffset() * 60000).toISOString();

    const task = {
      id: generateUUID(),
      title: routine.name,
      memo: '',
      dueDate: targetISO, // 対象日の日付を自動設定
      isCompleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      parentId: null,
      isTutorial: false,
      totalTime: 0,
      isTimerRunning: false,
      timerStartTime: null,
      duration: routine.duration,
      startTime: routine.startTime || null, // ルーティンの開始時刻
      endTime: routine.endTime || null, // ルーティンの終了時刻
      urgent: false,
      priority: '',
      isRoutine: true,
      routineId: routine.id
    };

    const allTasks = getTasks();
    allTasks.unshift(task);
    saveTasks(allTasks);
  });
}
