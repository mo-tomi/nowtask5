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
 * 月次の空き時間統計を計算
 */
function calculateMonthlyFreeTime(year, month) {
  const tasks = getTasks();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let totalScheduledMinutes = 0;
  let totalFreeMinutes = 0;
  let daysWithTasks = 0;

  // 各日の空き時間を計算
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dateTasks = tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      const taskDateStr = `${taskDate.getFullYear()}-${String(taskDate.getMonth() + 1).padStart(2, '0')}-${String(taskDate.getDate()).padStart(2, '0')}`;
      return taskDateStr === dateStr;
    });

    if (dateTasks.length > 0) {
      daysWithTasks++;
    }

    // その日のスケジュール時間を計算
    let dayScheduledMinutes = 0;
    dateTasks.forEach(task => {
      if (task.startTime && task.endTime) {
        const [startHour, startMin] = task.startTime.split(':').map(Number);
        const [endHour, endMin] = task.endTime.split(':').map(Number);
        const startMinutes = startHour * 60 + startMin;
        let endMinutes = endHour * 60 + endMin;

        // 日をまたぐ場合は24時までとして計算
        if (endMinutes < startMinutes) {
          endMinutes = 24 * 60;
        }

        dayScheduledMinutes += (endMinutes - startMinutes);
      }
    });

    totalScheduledMinutes += dayScheduledMinutes;
    // 1日24時間から予定時間を引く
    totalFreeMinutes += (24 * 60 - dayScheduledMinutes);
  }

  return {
    totalScheduledMinutes,
    totalFreeMinutes,
    totalScheduledHours: Math.floor(totalScheduledMinutes / 60),
    totalFreeHours: Math.floor(totalFreeMinutes / 60),
    averageFreeHoursPerDay: Math.floor(totalFreeMinutes / daysInMonth / 60),
    daysWithTasks,
    daysInMonth
  };
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
    const handleDateClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeCalendarModal();

      // モーダルが完全に閉じるのを待ってから次の処理
      setTimeout(() => {
        if (dateTasks.length > 0) {
          // タスクがある場合はスクロール
          scrollToDate(dateStr);
        } else {
          // タスクがない場合は新規作成モーダルを開く
          if (typeof openCreateModal === 'function') {
            openCreateModal();
            // モーダルが開いた後に日付を設定
            setTimeout(() => {
              const dateInput = document.getElementById('task-due-date');
              if (dateInput) {
                dateInput.value = dateStr;
              }
            }, 100);
          }
        }
      }, 100);
    };

    dateCell.addEventListener('click', handleDateClick);
    dateCell.addEventListener('touchend', handleDateClick);

    grid.appendChild(dateCell);
  }

  // 月次統計を表示
  renderMonthlyStats();
}

/**
 * 月次統計を表示
 */
function renderMonthlyStats() {
  const statsContainer = document.getElementById('calendar-monthly-stats');
  if (!statsContainer) return;

  const stats = calculateMonthlyFreeTime(currentCalendarYear, currentCalendarMonth);

  statsContainer.innerHTML = `
    <div class="monthly-stats-title">📊 ${currentCalendarYear}年${currentCalendarMonth + 1}月の統計</div>
    <div class="monthly-stats-grid">
      <div class="monthly-stat-card">
        <div class="stat-label">予定時間</div>
        <div class="stat-value">${stats.totalScheduledHours}<span class="stat-unit">時間</span></div>
      </div>
      <div class="monthly-stat-card">
        <div class="stat-label">空き時間</div>
        <div class="stat-value">${stats.totalFreeHours}<span class="stat-unit">時間</span></div>
      </div>
      <div class="monthly-stat-card">
        <div class="stat-label">1日平均空き時間</div>
        <div class="stat-value">${stats.averageFreeHoursPerDay}<span class="stat-unit">時間</span></div>
      </div>
      <div class="monthly-stat-card">
        <div class="stat-label">予定がある日</div>
        <div class="stat-value">${stats.daysWithTasks}<span class="stat-unit">/${stats.daysInMonth}日</span></div>
      </div>
    </div>
  `;
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
