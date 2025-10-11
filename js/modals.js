// ========================================
// モーダル管理
// ========================================

// 新規作成モーダルを開く
function openCreateModal() {
  editingTaskId = null;

  document.getElementById('modal-title').textContent = '新規タスク';
  document.getElementById('task-title').value = '';
  document.getElementById('task-memo').value = '';

  // 今日の日付をデフォルトに設定
  const today = new Date();
  const localISO = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  document.getElementById('task-due-date').value = localISO;

  document.getElementById('task-duration').value = '';
  document.getElementById('task-start-time').value = '';
  document.getElementById('task-end-time').value = '';
  document.getElementById('task-urgent').checked = false;
  document.getElementById('task-priority').value = '';
  document.getElementById('title-char-count').textContent = '0';
  document.getElementById('delete-btn').style.display = 'none';
  document.getElementById('timer-section').style.display = 'none';
  document.getElementById('subtasks-section').style.display = 'none';
  document.getElementById('save-btn').disabled = true;

  // 時間フィールドの自動計算イベントを設定
  setupTimeAutoCalculation();

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
    // ISO形式をdate形式に変換
    const date = new Date(task.dueDate);
    const localISO = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    document.getElementById('task-due-date').value = localISO;
  } else {
    document.getElementById('task-due-date').value = '';
  }
  // 所要時間・開始時刻・終了時刻・緊急・優先順位を反映
  document.getElementById('task-duration').value = task.duration || '';
  document.getElementById('task-start-time').value = task.startTime || '';
  document.getElementById('task-end-time').value = task.endTime || '';
  document.getElementById('task-urgent').checked = task.urgent || false;
  document.getElementById('task-priority').value = task.priority || '';

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

  // 時間フィールドの自動計算イベントを設定
  setupTimeAutoCalculation();

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
  const durationValue = document.getElementById('task-duration').value;
  const duration = durationValue ? parseInt(durationValue) : null;
  const startTime = document.getElementById('task-start-time').value || null;
  const endTime = document.getElementById('task-end-time').value || null;
  const urgent = document.getElementById('task-urgent').checked;
  const priority = document.getElementById('task-priority').value;

  // 期限日のみ（時刻なし）
  let dueDate = null;
  if (dueDateInput) {
    dueDate = new Date(dueDateInput + 'T00:00:00').toISOString();
  }

  if (editingTaskId) {
    // 更新
    updateTask(editingTaskId, { title, memo, dueDate, duration, startTime, endTime, urgent, priority });

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
        // サブタスクに duration が指定されていれば反映（通常は null）
        if (subtask.duration === undefined) subtask.duration = null;
        newTasks.unshift(subtask);
        saveTasks(newTasks);
      }
    });

    // サブタスクの時間をメインタスクに集計
    if (typeof aggregateSubtaskTimes === 'function') {
      aggregateSubtaskTimes(editingTaskId);
    }
  } else {
    // 新規作成
    const tasks = getTasks();
    const now = new Date().toISOString();
    const task = {
      id: generateUUID(),
      title: title,
      memo: memo,
      dueDate: dueDate,
      isCompleted: false,
      createdAt: now,
      updatedAt: now,
      parentId: null,
      isTutorial: false,
      totalTime: 0,
      isTimerRunning: false,
      timerStartTime: null,
      duration: duration,
      startTime: startTime,
      endTime: endTime,
      urgent: urgent,
      priority: priority
    };
    tasks.unshift(task);
    saveTasks(tasks);

    // 履歴に追加
    if (typeof addToTaskHistory === 'function') {
      addToTaskHistory(task.title, null, null, 20);
      try {
        document.dispatchEvent(new CustomEvent('task:history:updated'));
      } catch (e) {
        console.warn('CustomEvent dispatch failed for task:history:updated', e);
      }
    }
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
// 時間フィールドの自動計算
// ========================================

// 開始時刻と所要時間から終了時刻を自動計算
function setupTimeAutoCalculation() {
  const startTimeInput = document.getElementById('task-start-time');
  const durationInput = document.getElementById('task-duration');
  const endTimeInput = document.getElementById('task-end-time');

  // イベントリスナーを削除してから再設定（重複防止）
  const newStartTimeInput = startTimeInput.cloneNode(true);
  const newDurationInput = durationInput.cloneNode(true);
  startTimeInput.parentNode.replaceChild(newStartTimeInput, startTimeInput);
  durationInput.parentNode.replaceChild(newDurationInput, durationInput);

  const calculateEndTime = () => {
    const startTime = document.getElementById('task-start-time').value;
    const duration = document.getElementById('task-duration').value;
    const endTime = document.getElementById('task-end-time').value;

    // 開始時刻と所要時間が入力されていて、終了時刻が未入力の場合
    if (startTime && duration && !endTime) {
      const [startHour, startMin] = startTime.split(':').map(Number);
      const durationMinutes = parseInt(duration);

      // 開始時刻（分単位）
      const startTotalMinutes = startHour * 60 + startMin;
      // 終了時刻（分単位）
      let endTotalMinutes = startTotalMinutes + durationMinutes;

      // 24時間を超える場合は24時間以内に収める（翌日への繰越）
      if (endTotalMinutes >= 24 * 60) {
        endTotalMinutes = endTotalMinutes % (24 * 60);
      }

      const endHour = Math.floor(endTotalMinutes / 60);
      const endMin = endTotalMinutes % 60;

      // 終了時刻を設定
      document.getElementById('task-end-time').value =
        `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
    }
  };

  // 開始時刻が変更されたとき
  document.getElementById('task-start-time').addEventListener('input', calculateEndTime);
  // 所要時間が変更されたとき
  document.getElementById('task-duration').addEventListener('change', calculateEndTime);
}

// ========================================
// 設定モーダル
// ========================================

// 設定モーダルを開く
function openSettingsModal() {
  console.log('openSettingsModal called');
  renderRoutinesList();
  const modal = document.getElementById('settings-modal');
  if (modal) {
    modal.classList.add('show');
    console.log('Modal classList:', modal.classList);
  } else {
    console.error('settings-modal not found');
  }
}

// ルーティンリストを描画
function renderRoutinesList() {
  try {
    console.log('renderRoutinesList called');
    const routines = getRoutines();
    console.log('Routines:', routines);
    const container = document.getElementById('routines-list');
    if (!container) {
      console.error('routines-list container not found');
      return;
    }
    console.log('Container found:', container);
    container.innerHTML = '';

  if (!Array.isArray(routines)) {
    console.error('Routines is not an array:', routines);
    return;
  }

  console.log('Rendering', routines.length, 'routines');
  routines.forEach((routine, index) => {
    const item = document.createElement('div');
    item.className = 'routine-item';

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'routine-name-input';
    nameInput.value = routine.name || '';
    nameInput.placeholder = 'ルーティン名を入力';
    nameInput.maxLength = 50;
    nameInput.dataset.index = index;

    // 詳細設定ボタン
    const detailBtn = document.createElement('button');
    detailBtn.type = 'button';
    detailBtn.className = 'routine-detail-btn';
    detailBtn.textContent = '⏰';
    detailBtn.title = '時刻設定';
    detailBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const detailPanel = item.querySelector('.routine-detail-panel');
      if (detailPanel.style.display === 'none') {
        detailPanel.style.display = 'flex';
      } else {
        detailPanel.style.display = 'none';
      }
    });

    const durationInput = document.createElement('select');
    durationInput.className = 'routine-duration-input';
    durationInput.dataset.index = index;

    // 時間オプション
    const durationOptions = [
      { value: 5, text: '5分' },
      { value: 10, text: '10分' },
      { value: 15, text: '15分' },
      { value: 30, text: '30分' },
      { value: 45, text: '45分' },
      { value: 60, text: '1時間' },
      { value: 90, text: '1時間30分' },
      { value: 120, text: '2時間' },
      { value: 180, text: '3時間' },
      { value: 240, text: '4時間' },
      { value: 360, text: '6時間' },
      { value: 420, text: '7時間' },
      { value: 480, text: '8時間' },
      { value: 540, text: '9時間' }
    ];

    durationOptions.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.text;
      if (routine.duration === opt.value) {
        option.selected = true;
      }
      durationInput.appendChild(option);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'routine-delete-btn';
    deleteBtn.textContent = '×';
    deleteBtn.type = 'button';
    deleteBtn.addEventListener('click', () => {
      deleteRoutine(index);
    });

    // 詳細パネル（開始時刻・終了時刻）
    const detailPanel = document.createElement('div');
    detailPanel.className = 'routine-detail-panel';
    detailPanel.style.display = 'none';

    const startTimeLabel = document.createElement('label');
    startTimeLabel.textContent = '開始:';
    const startTimeInput = document.createElement('input');
    startTimeInput.type = 'time';
    startTimeInput.className = 'routine-time-input';
    startTimeInput.value = routine.startTime || '';
    startTimeInput.dataset.index = index;
    startTimeInput.dataset.field = 'startTime';

    const endTimeLabel = document.createElement('label');
    endTimeLabel.textContent = '終了:';
    const endTimeInput = document.createElement('input');
    endTimeInput.type = 'time';
    endTimeInput.className = 'routine-time-input';
    endTimeInput.value = routine.endTime || '';
    endTimeInput.dataset.index = index;
    endTimeInput.dataset.field = 'endTime';

    detailPanel.appendChild(startTimeLabel);
    detailPanel.appendChild(startTimeInput);
    detailPanel.appendChild(endTimeLabel);
    detailPanel.appendChild(endTimeInput);

    // アイテムに追加
    item.appendChild(nameInput);
    item.appendChild(durationInput);
    item.appendChild(detailBtn);
    item.appendChild(deleteBtn);
    item.appendChild(detailPanel);
    container.appendChild(item);
  });
  } catch (e) {
    console.error('Error in renderRoutinesList:', e);
    alert('ルーティンリストの表示エラー: ' + e.message);
  }
}

// ルーティンを削除
function deleteRoutine(index) {
  const routines = getRoutines();
  routines.splice(index, 1);
  saveRoutines(routines);
  renderRoutinesList();
}

// ルーティンを追加
function addRoutine() {
  // 現在の入力内容を保存してから新しいルーティンを追加
  const nameInputs = document.querySelectorAll('.routine-name-input');
  const durationInputs = document.querySelectorAll('.routine-duration-input');
  const routines = [];

  nameInputs.forEach((nameInput, index) => {
    const name = nameInput.value.trim();
    const existingRoutines = getRoutines();
    const routine = {
      id: existingRoutines[index]?.id || generateUUID(),
      name: name,
      duration: parseInt(durationInputs[index].value)
    };
    routines.push(routine);
  });

  // 新しい空のルーティンを追加
  const newRoutine = {
    id: generateUUID(),
    name: '',
    duration: 30
  };
  routines.push(newRoutine);

  saveRoutines(routines);
  renderRoutinesList();

  // 新規ルーティンの名前入力にフォーカス
  setTimeout(() => {
    const inputs = document.querySelectorAll('.routine-name-input');
    if (inputs.length > 0) {
      inputs[inputs.length - 1].focus();
    }
  }, 0);
}

// 設定モーダルを閉じる
function closeSettingsModal() {
  document.getElementById('settings-modal').classList.remove('show');
}

// 設定を保存
function saveSettings() {
  const routines = [];
  const nameInputs = document.querySelectorAll('.routine-name-input');
  const durationInputs = document.querySelectorAll('.routine-duration-input');
  const timeInputs = document.querySelectorAll('.routine-time-input');

  nameInputs.forEach((nameInput, index) => {
    const name = nameInput.value.trim();
    if (name) {
      // 開始時刻と終了時刻を取得
      let startTime = '';
      let endTime = '';
      timeInputs.forEach(input => {
        const inputIndex = parseInt(input.dataset.index);
        if (inputIndex === index) {
          if (input.dataset.field === 'startTime') {
            startTime = input.value || '';
          } else if (input.dataset.field === 'endTime') {
            endTime = input.value || '';
          }
        }
      });

      const routine = {
        id: getRoutines()[index]?.id || generateUUID(),
        name: name,
        duration: parseInt(durationInputs[index].value),
        startTime: startTime,
        endTime: endTime
      };
      routines.push(routine);
    }
  });

  saveRoutines(routines);
  closeSettingsModal();

  // ルーティンタスクを作成
  createDailyRoutineTasks();
  renderTasks();
}
