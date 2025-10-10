// ========================================
// カレンダー機能
// ========================================

let currentCalendarYear = new Date().getFullYear();
let currentCalendarMonth = new Date().getMonth(); // 0-11

/**
 * カレンダーモーダルを開く
 */
function openCalendarModal() {
  const modal = document.getElementById('calendar-modal');
  if (!modal) return;

  // 現在の年月に設定
  const today = new Date();
  currentCalendarYear = today.getFullYear();
  currentCalendarMonth = today.getMonth();

  // カレンダーを描画
  renderCalendar();

  // モーダルを表示
  modal.style.display = 'flex';
  modal.classList.add('show');
}

/**
 * カレンダーモーダルを閉じる
 */
function closeCalendarModal() {
  const modal = document.getElementById('calendar-modal');
  if (!modal) return;

  modal.style.display = 'none';
  modal.classList.remove('show');
}

/**
 * カレンダーを描画
 */
function renderCalendar() {
  // 年月表示を更新
  const monthLabel = document.getElementById('calendar-current-month');
  if (monthLabel) {
    monthLabel.textContent = `${currentCalendarYear}年${currentCalendarMonth + 1}月`;
  }

  // カレンダーグリッドを取得
  const grid = document.getElementById('calendar-grid');
  if (!grid) return;

  // 既存の日付セルを削除（曜日ヘッダーは残す）
  const dayCells = grid.querySelectorAll('.calendar-day');
  dayCells.forEach(cell => cell.remove());

  // 月の最初の日と最後の日を取得
  const firstDay = new Date(currentCalendarYear, currentCalendarMonth, 1);
  const lastDay = new Date(currentCalendarYear, currentCalendarMonth + 1, 0);

  // 月の最初の日の曜日（0: 日曜日）
  const firstDayOfWeek = firstDay.getDay();

  // 月の日数
  const daysInMonth = lastDay.getDate();

  // 今日の日付
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === currentCalendarYear && today.getMonth() === currentCalendarMonth;
  const todayDate = today.getDate();

  // タスクデータを取得
  const tasks = getTasks();

  // 前月の空白セルを追加
  for (let i = 0; i < firstDayOfWeek; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'calendar-day empty';
    grid.appendChild(emptyCell);
  }

  // 日付セルを生成
  for (let day = 1; day <= daysInMonth; day++) {
    const dateCell = document.createElement('div');
    dateCell.className = 'calendar-day';

    // 今日の日付にクラスを追加
    if (isCurrentMonth && day === todayDate) {
      dateCell.classList.add('today');
    }

    // 日付番号
    const dayNumber = document.createElement('div');
    dayNumber.className = 'calendar-day-number';
    dayNumber.textContent = day;
    dateCell.appendChild(dayNumber);

    // その日のタスク数を計算
    const dateStr = `${currentCalendarYear}-${String(currentCalendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dateTasks = tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      const taskDateStr = `${taskDate.getFullYear()}-${String(taskDate.getMonth() + 1).padStart(2, '0')}-${String(taskDate.getDate()).padStart(2, '0')}`;
      return taskDateStr === dateStr;
    });

    // タスク数表示
    if (dateTasks.length > 0) {
      const taskCount = document.createElement('div');
      taskCount.className = 'calendar-task-count';
      taskCount.textContent = `${dateTasks.length}件`;
      dateCell.appendChild(taskCount);

      // 完了・未完了の状態を表示
      const completedCount = dateTasks.filter(t => t.isCompleted).length;
      const incompleteCount = dateTasks.length - completedCount;

      const taskStatus = document.createElement('div');
      taskStatus.className = 'calendar-task-status';
      if (incompleteCount > 0) {
        taskStatus.innerHTML = `<span class="incomplete-dot"></span>${incompleteCount}`;
      }
      if (completedCount > 0) {
        taskStatus.innerHTML += ` <span class="complete-dot"></span>${completedCount}`;
      }
      dateCell.appendChild(taskStatus);
    }

    // クリックイベント: タスクがあればスクロール、なければ新規作成
    dateCell.addEventListener('click', () => {
      closeCalendarModal();
      if (dateTasks.length > 0) {
        // タスクがある場合はスクロール
        scrollToDate(dateStr);
      } else {
        // タスクがない場合は新規作成モーダルを開く
        openCreateModalForDate(dateStr);
      }
    });

    grid.appendChild(dateCell);
  }
}

/**
 * 指定日付のタスクにスクロール
 */
function scrollToDate(dateStr) {
  // date-separatorを探す
  const separators = document.querySelectorAll('.date-separator');
  let targetSeparator = null;

  separators.forEach(sep => {
    if (sep.dataset.date === dateStr) {
      targetSeparator = sep;
    }
  });

  if (targetSeparator) {
    // スムーズスクロール
    targetSeparator.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    // その日のタスクがない場合はメッセージ
    alert('この日のタスクはありません');
  }
}

/**
 * 前月に移動
 */
function goToPreviousMonth() {
  currentCalendarMonth--;
  if (currentCalendarMonth < 0) {
    currentCalendarMonth = 11;
    currentCalendarYear--;
  }
  renderCalendar();
}

/**
 * 次月に移動
 */
function goToNextMonth() {
  currentCalendarMonth++;
  if (currentCalendarMonth > 11) {
    currentCalendarMonth = 0;
    currentCalendarYear++;
  }
  renderCalendar();
}

/**
 * 指定日付の新規タスク作成モーダルを開く
 */
function openCreateModalForDate(dateStr) {
  openCreateModal();
  // モーダルが開いた後に日付を設定
  setTimeout(() => {
    const dateInput = document.getElementById('task-due-date');
    if (dateInput) {
      dateInput.value = dateStr;
    }
  }, 0);
}
