// ========================================
// 時間オーバー警告機能
// ========================================

/**
 * 時間オーバー警告モーダルを開く
 * @param {number} overloadMinutes - オーバーしている分数
 * @param {Array} tasks - 今日のタスク一覧
 */
function openTimeOverloadModal(overloadMinutes, tasks) {
  const modal = document.getElementById('time-overload-modal');
  if (!modal) return;

  // オーバー時間を表示
  const overloadAmountEl = document.getElementById('overload-amount');
  const hours = Math.floor(Math.abs(overloadMinutes) / 60);
  const mins = Math.abs(overloadMinutes) % 60;

  if (hours > 0) {
    overloadAmountEl.textContent = `${hours}時間${mins > 0 ? mins + '分' : ''}`;
  } else {
    overloadAmountEl.textContent = `${mins}分`;
  }

  // タスクリストを生成
  renderOverloadTasks(tasks);

  // モーダルを表示
  modal.style.display = 'flex';
  modal.classList.add('show');
}

/**
 * 時間オーバー警告モーダルを閉じる
 */
function closeTimeOverloadModal() {
  const modal = document.getElementById('time-overload-modal');
  if (!modal) return;

  modal.style.display = 'none';
  modal.classList.remove('show');
}

/**
 * 時間オーバーのタスクリストを描画
 * @param {Array} tasks - 今日のタスク一覧
 */
function renderOverloadTasks(tasks) {
  const container = document.getElementById('overload-tasks-list');
  if (!container) return;

  container.innerHTML = '';

  // タスクを時間が長い順にソート
  const sortedTasks = [...tasks].sort((a, b) => {
    const getDuration = (task) => {
      if (task.startTime && task.endTime) {
        const [startHour, startMin] = task.startTime.split(':').map(Number);
        const [endHour, endMin] = task.endTime.split(':').map(Number);
        const startMinutes = startHour * 60 + startMin;
        let endMinutes = endHour * 60 + endMin;
        if (endMinutes < startMinutes) endMinutes += 24 * 60;
        return endMinutes - startMinutes;
      }
      return task.duration || 0;
    };
    return getDuration(b) - getDuration(a);
  });

  sortedTasks.forEach(task => {
    const taskEl = document.createElement('div');
    taskEl.className = 'overload-task-item';

    // タスクの時間を計算
    let timeText = '';
    if (task.startTime && task.endTime) {
      timeText = `${task.startTime} ~ ${task.endTime}`;
    } else if (task.duration) {
      const hours = Math.floor(task.duration / 60);
      const mins = task.duration % 60;
      timeText = hours > 0 ? `${hours}時間${mins}分` : `${mins}分`;
    }

    taskEl.innerHTML = `
      <div class="overload-task-info">
        <div class="overload-task-title">${escapeHtml(task.title)}</div>
        <div class="overload-task-time">${timeText}</div>
      </div>
      <div class="overload-task-actions">
        <button class="btn-edit-task" data-task-id="${task.id}" title="編集">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
        <button class="btn-postpone-task" data-task-id="${task.id}" title="明日に延期">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </button>
        <button class="btn-delete-task" data-task-id="${task.id}" title="削除">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    `;

    container.appendChild(taskEl);
  });

  // イベントリスナーを追加
  attachOverloadTaskEvents();
}

/**
 * タスクアクションのイベントリスナーを追加
 */
function attachOverloadTaskEvents() {
  // 編集ボタン
  document.querySelectorAll('.btn-edit-task').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const taskId = btn.dataset.taskId;
      closeTimeOverloadModal();
      openEditModal(taskId);
    });
  });

  // 延期ボタン
  document.querySelectorAll('.btn-postpone-task').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const taskId = btn.dataset.taskId;
      postponeTaskToTomorrow(taskId);
    });
  });

  // 削除ボタン
  document.querySelectorAll('.btn-delete-task').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const taskId = btn.dataset.taskId;
      deleteTaskFromOverload(taskId);
    });
  });
}

/**
 * タスクを明日に延期
 * @param {string} taskId - タスクID
 */
function postponeTaskToTomorrow(taskId) {
  const tasks = getTasks();
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  // 明日の日付を設定
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  task.dueDate = tomorrow.toISOString();
  task.updatedAt = new Date().toISOString();

  saveTasks(tasks);
  renderTasks();
  updateTimeGauge();

  // リストを再描画
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTasks = tasks.filter(t => {
    if (t.isCompleted || t.isRoutine) return false;
    if (t.dueDate) {
      const dueDate = new Date(t.dueDate);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return dueDate >= today && dueDate < tomorrow;
    }
    return false;
  });

  if (todayTasks.length > 0) {
    renderOverloadTasks(todayTasks);
  } else {
    closeTimeOverloadModal();
  }
}

/**
 * タスクを削除（ゴミ箱に移動）
 * @param {string} taskId - タスクID
 */
function deleteTaskFromOverload(taskId) {
  const tasks = getTasks();
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  task.isDeleted = true;
  task.deletedAt = new Date().toISOString();
  task.updatedAt = new Date().toISOString();

  saveTasks(tasks);
  renderTasks();
  updateTimeGauge();

  // リストを再描画
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTasks = tasks.filter(t => {
    if (t.isCompleted || t.isRoutine || t.isDeleted) return false;
    if (t.dueDate) {
      const dueDate = new Date(t.dueDate);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return dueDate >= today && dueDate < tomorrow;
    }
    return false;
  });

  if (todayTasks.length > 0) {
    renderOverloadTasks(todayTasks);
  } else {
    closeTimeOverloadModal();
  }
}

/**
 * HTMLエスケープ
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
