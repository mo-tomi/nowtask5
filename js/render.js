// ========================================
// レンダリング関数
// ========================================

// グローバル変数（インライン追加中のタスク）
let addingSubtaskForTaskId = null;

// 日付ごとにタスクをグループ化
function groupTasksByDate(tasks) {
  const groups = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  tasks.forEach(task => {
    let dateKey, label;

    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);

      // 今日、明日、昨日、それ以外で判定
      if (dueDate.getTime() === today.getTime()) {
        dateKey = 'today';
        label = '今日';
      } else if (dueDate.getTime() === tomorrow.getTime()) {
        dateKey = 'tomorrow';
        label = '明日';
      } else if (dueDate.getTime() === yesterday.getTime()) {
        dateKey = 'yesterday';
        label = '昨日';
      } else if (dueDate < today) {
        dateKey = 'overdue_' + dueDate.getTime();
        label = formatDate(task.dueDate) + ' (期限切れ)';
      } else {
        dateKey = 'future_' + dueDate.getTime();
        label = formatDate(task.dueDate);
      }
    } else {
      dateKey = 'no_date';
      label = '期限なし';
    }

    if (!groups[dateKey]) {
      // dateObj はそのグループの日付（午前0時）を保持する。期限なしは null。
      let dateObj = null;
      if (task.dueDate) {
        dateObj = new Date(task.dueDate);
        dateObj.setHours(0, 0, 0, 0);
      }
      groups[dateKey] = { date: dateKey, label, tasks: [], sortOrder: getSortOrder(dateKey, task.dueDate), dateObj };
    }
    groups[dateKey].tasks.push(task);
  });

  // ソート順序: 期限切れ → 昨日 → 今日 → 明日 → 未来 → 期限なし
  return Object.values(groups).sort((a, b) => a.sortOrder - b.sortOrder);
}

function getSortOrder(dateKey, dueDate) {
  if (dateKey.startsWith('overdue_')) return -1000 + new Date(dueDate).getTime();
  if (dateKey === 'yesterday') return -2;
  if (dateKey === 'today') return -1;
  if (dateKey === 'tomorrow') return 0;
  if (dateKey.startsWith('future_')) return 1000 + new Date(dueDate).getTime();
  return 10000; // 期限なし
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const weekday = weekdays[date.getDay()];
  return `${month}月${day}日 (${weekday})`;
}

// Date オブジェクトを YYYY-MM-DD 形式の文字列に変換（null 安全）
function formatDateISO(dateObj) {
  if (!dateObj) return '';
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// グローバルフィルター状態
let currentFilter = null; // 'urgent' | 'high-priority' | null

// タスクリスト表示
function renderTasks() {
  const tasks = getTasks();
  const trash = loadFromStorage(STORAGE_KEYS.TRASH, []);

  // 並び替え設定を取得（localStorage から復元）
  const savedSort = loadFromStorage(STORAGE_KEYS.SORT_PREFERENCE, 'time');
  const sortSelectEl = document.getElementById('sort-select');
  if (sortSelectEl) {
    sortSelectEl.value = savedSort;
    // 変更時に保存して再描画
    sortSelectEl.onchange = () => {
      saveToStorage(STORAGE_KEYS.SORT_PREFERENCE, sortSelectEl.value);
      renderTasks();
    };
  }

  let activeTasks = tasks.filter(t => !t.isCompleted && !t.parentId);

  // 絞り込み適用
  if (currentFilter === 'urgent') {
    activeTasks = activeTasks.filter(t => t.urgent);
  } else if (currentFilter === 'high-priority') {
    activeTasks = activeTasks.filter(t => t.priority === 'high');
  }

  // 並び替え設定（レンダリング時に各日付グループ内で適用する）
  const sortPref = (sortSelectEl && sortSelectEl.value) || savedSort || 'time';
  const completedTasks = tasks.filter(t => t.isCompleted && !t.parentId);

  // タスクタブ
  const tasksList = document.getElementById('tasks-list');
  const tasksEmpty = document.getElementById('tasks-empty');
  tasksList.innerHTML = '';

  if (activeTasks.length === 0) {
    tasksEmpty.classList.add('show');
  } else {
    tasksEmpty.classList.remove('show');

    // 日付ごとにタスクをグループ化
    const tasksByDate = groupTasksByDate(activeTasks);

    // 日付順にレンダリング
    tasksByDate.forEach(({ date, label, tasks: dateTasks }) => {
      // 各日付グループ内でソートを適用
      if (sortPref === 'time') {
        dateTasks.sort((a, b) => {
          // 期限なしは末尾に回す
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate) - new Date(b.dueDate);
        });
      } else if (sortPref === 'created') {
        // 追加順: createdAt の降順（新しいものを上に）
        dateTasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      } else if (sortPref === 'priority') {
        // 優先順位順: 緊急 > 高 > 中 > 低 > 未設定
        const priorityOrder = { high: 1, medium: 2, low: 3, '': 4 };
        dateTasks.sort((a, b) => {
          // 緊急フラグを最優先
          if (a.urgent && !b.urgent) return -1;
          if (!a.urgent && b.urgent) return 1;
          // 優先度で比較
          const aPriority = priorityOrder[a.priority || ''] || 4;
          const bPriority = priorityOrder[b.priority || ''] || 4;
          return aPriority - bPriority;
        });
      }
      // 日付セパレーター
      const dateSeparator = document.createElement('div');
      dateSeparator.className = 'date-separator';
      // data-date に ISO 日付（YYYY-MM-DD）を入れておくとスクロール連動で判定しやすい
      const isoDate = (date === 'no_date') ? '' : (tasksByDate.find(g => g.date === date) && formatDateISO(tasksByDate.find(g => g.date === date).dateObj));
      dateSeparator.dataset.date = isoDate || '';
      dateSeparator.innerHTML = `
        <div class="date-separator-line"></div>
        <div class="date-separator-label">${label}</div>
        <div class="date-separator-line"></div>
      `;
      tasksList.appendChild(dateSeparator);

      // タスクをレンダリング
      dateTasks.forEach(task => {
        renderTaskWithSubtasks(task, tasksList, false);
      });
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

  // 棚上げタブ
  const shelved = loadFromStorage(STORAGE_KEYS.SHELVED, []);
  const shelfList = document.getElementById('shelf-list');
  const shelfEmpty = document.getElementById('shelf-empty');
  shelfList.innerHTML = '';

  if (shelved.length === 0) {
    shelfEmpty.classList.add('show');
  } else {
    shelfEmpty.classList.remove('show');
    shelved.forEach(task => {
      shelfList.appendChild(createShelfElement(task));
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
  div.dataset.taskId = task.id;
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

  // 緊急ラベル
  if (task.urgent) {
    const urgentLabel = document.createElement('span');
    urgentLabel.className = 'task-urgent-label';
    urgentLabel.textContent = '🚨 緊急';
    meta.appendChild(urgentLabel);
  }

  // 優先順位ラベル
  if (task.priority) {
    const priorityLabel = document.createElement('span');
    priorityLabel.className = `task-priority-label ${task.priority}`;
    const priorityText = {
      high: '優先度: 高',
      medium: '優先度: 中',
      low: '優先度: 低'
    };
    priorityLabel.textContent = priorityText[task.priority] || '';
    meta.appendChild(priorityLabel);
  }

  // 開始時刻・終了時刻
  if (task.startTime || task.endTime) {
    const timeSpan = document.createElement('span');
    timeSpan.className = 'task-duration';
    if (task.startTime && task.endTime) {
      timeSpan.textContent = `🕒 ${task.startTime} ~ ${task.endTime}`;
    } else if (task.startTime) {
      timeSpan.textContent = `🕒 ${task.startTime} ~`;
    } else if (task.endTime) {
      timeSpan.textContent = `🕒 ~ ${task.endTime}`;
    }
    meta.appendChild(timeSpan);
  }

  // サブタスク数表示（子タスクを持つ場合）
  const subtasks = getSubtasks(task.id);
  if (subtasks.length > 0) {
    // 折りたたみトグル（サブタスクを持つ親タスクに表示）
    const collapseToggle = document.createElement('button');
    collapseToggle.className = 'collapse-toggle';
    collapseToggle.title = 'サブタスクを折りたたむ/展開する';
    // 初期は展開状態
    collapseToggle.textContent = '▼';
    // data 属性で開閉状態を管理
    div.dataset.collapsed = 'false';

    collapseToggle.addEventListener('click', (e) => {
      // モーダルや編集イベントを発火させない
      e.stopPropagation();
      const parentLevel = Number(div.dataset.level || 0);
      const isCollapsed = div.dataset.collapsed === 'true';

      // トグル表示
      div.dataset.collapsed = isCollapsed ? 'false' : 'true';
      collapseToggle.textContent = isCollapsed ? '▼' : '▶';

      // 親要素の次の兄弟要素から探索し、親より深いレベルの要素を隠す/表示する
      let sibling = div.nextElementSibling;
      while (sibling) {
        const siblingLevel = Number(sibling.dataset.level || 0);
        // 親より深ければサブタスクとみなす
        if (siblingLevel > parentLevel) {
          if (div.dataset.collapsed === 'true') {
            sibling.classList.add('subtask-hidden');
          } else {
            sibling.classList.remove('subtask-hidden');
          }
        } else {
          // 同レベルかそれ以下に到達したらサブタスク列の終端
          break;
        }
        sibling = sibling.nextElementSibling;
      }
    });

    meta.appendChild(collapseToggle);

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
      timer.textContent = '⏱️ 計測中...';
    } else {
      timer.textContent = '⏱️ ' + formatTime(task.totalTime);
    }
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

  // タスクアクション部分
  const actions = document.createElement('div');
  actions.className = 'task-card-actions';

  // 時間記録停止ボタン（タイマー実行中のみ表示）
  if (task.isTimerRunning) {
    const stopBtn = document.createElement('button');
    stopBtn.className = 'timer-stop-btn';
    stopBtn.innerHTML = '⏹';
    stopBtn.title = '時間記録停止';
    stopBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      stopTaskTimer(task.id);
      renderTasks();
    });
    actions.appendChild(stopBtn);
  }

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
    actions.appendChild(addSubtaskIcon);
  }

  // メニューボタン
  const menuBtn = document.createElement('button');
  menuBtn.className = 'task-menu-btn';
  menuBtn.innerHTML = '⋮';
  menuBtn.title = 'メニュー';
  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    showTaskMenu(e, task);
  });
  actions.appendChild(menuBtn);

  div.appendChild(actions);

  // カード全体のクリックで編集（チェックボックスとボタン以外）
  div.addEventListener('click', (e) => {
    if (!e.target.closest('.task-checkbox') && !e.target.closest('.task-card-actions')) {
      openEditModal(task.id);
    }
  });

  // ドラッグ&ドロップ機能
  setupDragAndDrop(div, task);

  return div;
}

// 棚上げ要素作成
function createShelfElement(task) {
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
  meta.textContent = '棚上げ日: ' + formatDateTime(task.shelvedAt);
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
  restoreBtn.title = '復帰';
  restoreBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    confirmAction('このタスクを復帰させますか？', () => {
      unshelveTask(task.id);
      renderTasks();
    });
  });

  actions.appendChild(restoreBtn);
  div.appendChild(actions);

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
// ドラッグ&ドロップ機能
// ========================================
let draggedElement = null;
let longPressTimer = null;
let isDragging = false;

function setupDragAndDrop(element, task) {
  let startY = 0;
  let startX = 0;

  // タッチデバイス用の長押し検出
  element.addEventListener('touchstart', (e) => {
    // チェックボックスやボタンの場合は無視
    if (e.target.closest('.task-checkbox') || e.target.closest('.task-card-actions')) {
      return;
    }

    const touch = e.touches[0];
    startY = touch.clientY;
    startX = touch.clientX;

    // 500ms長押しでドラッグ開始
    longPressTimer = setTimeout(() => {
      isDragging = true;
      draggedElement = element;
      element.classList.add('dragging');
      // 振動フィードバック（対応デバイスのみ）
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 500);
  });

  element.addEventListener('touchmove', (e) => {
    if (longPressTimer) {
      const touch = e.touches[0];
      const moveY = Math.abs(touch.clientY - startY);
      const moveX = Math.abs(touch.clientX - startX);
      // 10px以上動いたら長押しキャンセル
      if (moveY > 10 || moveX > 10) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    }

    if (isDragging && draggedElement) {
      e.preventDefault();
      const touch = e.touches[0];
      const afterElement = getDragAfterElement(element.parentElement, touch.clientY);

      if (afterElement == null) {
        element.parentElement.appendChild(draggedElement);
      } else {
        element.parentElement.insertBefore(draggedElement, afterElement);
      }
    }
  });

  element.addEventListener('touchend', (e) => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }

    if (isDragging && draggedElement) {
      e.preventDefault();
      element.classList.remove('dragging');

      // 新しい順序を保存
      saveNewTaskOrder();

      isDragging = false;
      draggedElement = null;
    }
  });

  // PC用のドラッグ&ドロップ
  element.setAttribute('draggable', 'true');

  element.addEventListener('dragstart', (e) => {
    // チェックボックスやボタンの場合は無視
    if (e.target.closest('.task-checkbox') || e.target.closest('.task-card-actions')) {
      e.preventDefault();
      return;
    }

    draggedElement = element;
    element.classList.add('dragging');
  });

  element.addEventListener('dragend', () => {
    element.classList.remove('dragging');

    // 新しい順序を保存
    saveNewTaskOrder();

    draggedElement = null;
  });

  element.addEventListener('dragover', (e) => {
    e.preventDefault();
    const afterElement = getDragAfterElement(element.parentElement, e.clientY);

    if (draggedElement && draggedElement !== element) {
      if (afterElement == null) {
        element.parentElement.appendChild(draggedElement);
      } else {
        element.parentElement.insertBefore(draggedElement, afterElement);
      }
    }
  });
}

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.task-item:not(.dragging)')];

  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;

    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function saveNewTaskOrder() {
  const tasks = getTasks();
  const taskElements = document.querySelectorAll('.task-item:not(.completed)');

  // 新しい順序でタスクIDを取得
  const newOrder = [];
  taskElements.forEach(el => {
    const taskId = el.dataset.taskId;
    if (taskId) {
      newOrder.push(taskId);
    }
  });

  // タスクの順序を更新（customOrder フィールドを追加）
  tasks.forEach((task, index) => {
    const newIndex = newOrder.indexOf(task.id);
    if (newIndex !== -1) {
      task.customOrder = newIndex;
    }
  });

  // 保存
  saveTasks(tasks);

  // 再レンダリング
  renderTasks();
}

// ========================================
// タスクメニュー
// ========================================
function showTaskMenu(event, task) {
  // 既存のメニューを削除
  const existingMenu = document.querySelector('.task-context-menu');
  if (existingMenu) {
    existingMenu.remove();
  }

  // メニューを作成
  const menu = document.createElement('div');
  menu.className = 'task-context-menu';

  // 時間記録開始/停止ボタン
  const timerItem = document.createElement('div');
  timerItem.className = 'menu-item';
  if (task.isTimerRunning) {
    timerItem.textContent = '⏸️ 時間記録停止';
    timerItem.addEventListener('click', () => {
      stopTaskTimer(task.id);
      menu.remove();
      renderTasks();
    });
  } else {
    timerItem.textContent = '▶️ 時間記録開始';
    timerItem.addEventListener('click', () => {
      startTaskTimer(task.id);
      menu.remove();
      renderTasks();
    });
  }
  menu.appendChild(timerItem);

  // 編集ボタン
  const editItem = document.createElement('div');
  editItem.className = 'menu-item';
  editItem.textContent = '✏️ 編集';
  editItem.addEventListener('click', () => {
    openEditModal(task.id);
    menu.remove();
  });
  menu.appendChild(editItem);

  // 棚上げボタン
  const shelfItem = document.createElement('div');
  shelfItem.className = 'menu-item';
  shelfItem.textContent = '📦 棚上げ';
  shelfItem.addEventListener('click', () => {
    confirmAction('このタスクを棚上げしますか？', () => {
      shelveTask(task.id);
      renderTasks();
    });
    menu.remove();
  });
  menu.appendChild(shelfItem);

  // メニューの位置を設定
  const rect = event.target.getBoundingClientRect();
  menu.style.position = 'fixed';
  menu.style.top = `${rect.bottom + 5}px`;
  menu.style.left = `${rect.left}px`;

  document.body.appendChild(menu);

  // メニュー外をクリックで閉じる
  setTimeout(() => {
    document.addEventListener('click', function closeMenu(e) {
      if (!menu.contains(e.target)) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    });
  }, 0);
}
