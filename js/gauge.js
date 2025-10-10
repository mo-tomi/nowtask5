// ========================================
// 24時間ゲージ
// ========================================

// 現在表示中の日付（ISO形式: YYYY-MM-DD）
let currentGaugeDate = null;

// ゲージの日付を初期化
function initGaugeDate() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  currentGaugeDate = formatDateISO(today);
}

// ゲージの日付を変更
function changeGaugeDate(offset) {
  if (!currentGaugeDate) initGaugeDate();

  const date = new Date(currentGaugeDate);
  date.setDate(date.getDate() + offset);
  currentGaugeDate = formatDateISO(date);

  updateGaugeDateLabel();
  updateTimeGauge(currentGaugeDate);
}

// 日付ラベルを更新
function updateGaugeDateLabel() {
  const labelEl = document.getElementById('gauge-date-label');
  if (!labelEl || !currentGaugeDate) return;

  const date = new Date(currentGaugeDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const weekday = weekdays[date.getDay()];

  if (formatDateISO(date) === formatDateISO(today)) {
    labelEl.textContent = `今日 ${month}月${day}日(${weekday})`;
  } else if (formatDateISO(date) === formatDateISO(tomorrow)) {
    labelEl.textContent = `明日 ${month}月${day}日(${weekday})`;
  } else if (formatDateISO(date) === formatDateISO(yesterday)) {
    labelEl.textContent = `昨日 ${month}月${day}日(${weekday})`;
  } else {
    labelEl.textContent = `${month}月${day}日(${weekday})`;
  }
}

// スワイプ検知を初期化
function initGaugeSwipe() {
  const container = document.getElementById('time-gauge-container');
  if (!container) return;

  let startX = 0;
  let startY = 0;
  let isDragging = false;

  container.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    isDragging = true;
  }, { passive: true });

  container.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
  }, { passive: true });

  container.addEventListener('touchend', (e) => {
    if (!isDragging) return;
    isDragging = false;

    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const diffX = endX - startX;
    const diffY = endY - startY;

    // 横方向のスワイプ判定（50px以上、かつ縦方向より横方向が大きい）
    if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 0) {
        // 右スワイプ: 前日
        changeGaugeDate(-1);
      } else {
        // 左スワイプ: 翌日
        changeGaugeDate(1);
      }
    }
  }, { passive: true });

  // ナビゲーションボタン
  const prevBtn = document.getElementById('gauge-prev-btn');
  const nextBtn = document.getElementById('gauge-next-btn');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => changeGaugeDate(-1));
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => changeGaugeDate(1));
  }
}

// 時間帯のタスク一覧を表示
function showTimeSlotTasks(startMinutes, endMinutes) {
  const startHour = Math.floor(startMinutes / 60);
  const startMin = startMinutes % 60;
  const endHour = Math.floor(endMinutes / 60);
  const endMin = endMinutes % 60;

  const timeRange = `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')} ~ ${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;

  // 該当時間帯のタスクを取得
  const tasks = getTasks();
  const matchingTasks = tasks.filter(task => {
    if (task.isCompleted || !task.startTime || !task.endTime) return false;

    const [taskStartHour, taskStartMin] = task.startTime.split(':').map(Number);
    const [taskEndHour, taskEndMin] = task.endTime.split(':').map(Number);
    const taskStartMinutes = taskStartHour * 60 + taskStartMin;
    const taskEndMinutes = taskEndHour * 60 + taskEndMin;

    // 時間帯が重なっているかチェック
    return (taskStartMinutes < endMinutes && taskEndMinutes > startMinutes);
  });

  if (matchingTasks.length === 0) {
    alert(`${timeRange}\nこの時間帯にタスクはありません`);
    return;
  }

  // モーダルを表示
  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.style.display = 'flex';

  const modalContent = document.createElement('div');
  modalContent.className = 'modal-content time-slot-modal';

  const header = document.createElement('div');
  header.className = 'modal-header';
  header.innerHTML = `
    <h2>${timeRange} のタスク</h2>
    <button class="close-btn">&times;</button>
  `;

  const body = document.createElement('div');
  body.className = 'modal-body';

  matchingTasks.forEach(task => {
    const taskDiv = document.createElement('div');
    taskDiv.className = 'time-slot-task-item';
    taskDiv.innerHTML = `
      <div class="task-title">${task.title}</div>
      <div class="task-time">🕒 ${task.startTime} ~ ${task.endTime}</div>
      ${task.memo ? `<div class="task-memo">${task.memo}</div>` : ''}
    `;
    taskDiv.addEventListener('click', () => {
      modal.remove();
      openEditModal(task.id);
    });
    body.appendChild(taskDiv);
  });

  const footer = document.createElement('div');
  footer.className = 'modal-footer';
  footer.innerHTML = `<button class="btn btn-secondary">閉じる</button>`;

  modalContent.appendChild(header);
  modalContent.appendChild(body);
  modalContent.appendChild(footer);
  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  // 閉じるイベント
  const closeBtn = header.querySelector('.close-btn');
  const closeFooterBtn = footer.querySelector('.btn');

  closeBtn.addEventListener('click', () => modal.remove());
  closeFooterBtn.addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
}

// 24時間ゲージ更新
// dateArg: Date オブジェクトか ISO 日付文字列（YYYY-MM-DD）を受け取る。未指定なら現在日時を使用。
function updateTimeGauge(dateArg) {
  let now = new Date();
  let targetDate = new Date(now);
  if (dateArg) {
    if (typeof dateArg === 'string') {
      // ISO 日付文字列（YYYY-MM-DD）ならその日の0時を使う
      const parts = dateArg.split('-');
      if (parts.length === 3) {
        targetDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      }
    } else if (dateArg instanceof Date) {
      targetDate = new Date(dateArg);
      targetDate.setHours(0,0,0,0);
    }
    // ゲージの基準時刻は targetDate の午前0時からの相対として表示するため、now は targetDate の現在時刻相当を使用する
    // もし targetDate が今日でない場合は、現在時刻を targetDate の午前0時に置き換え（表示上は0%）
    const today = new Date();
    today.setHours(0,0,0,0);
    if (formatDateISO(targetDate) !== formatDateISO(today)) {
      // 表示時刻を targetDate の 0:00 に設定（経過は0）
      now = new Date(targetDate);
      now.setHours(0,0,0,0);
    }
  }
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

  // 指定日の日付で予定を集計するよう updateScheduledTasks を呼び出す
  updateScheduledTasks(dateArg);
}

// 今日の予定タスク時間を表示
// dateArg: Date オブジェクトか ISO 日付文字列（YYYY-MM-DD）。未指定なら今日を対象。
function updateScheduledTasks(dateArg) {
  // baseDate を対象日の 0:00 に設定
  let baseDate = new Date();
  baseDate.setHours(0, 0, 0, 0);
  if (dateArg) {
    if (typeof dateArg === 'string') {
      const parts = dateArg.split('-');
      if (parts.length === 3) baseDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    } else if (dateArg instanceof Date) {
      baseDate = new Date(dateArg);
      baseDate.setHours(0,0,0,0);
    }
  }

  // 対象日のルーティンタスクを自動生成
  if (typeof createDailyRoutineTasks === 'function') {
    createDailyRoutineTasks(baseDate);
  }

  const tasks = getTasks();

  const tomorrow = new Date(baseDate);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const yesterday = new Date(baseDate);
  yesterday.setDate(yesterday.getDate() - 1);

  // 変更点の説明（日本語コメント）:
  // - 期限なしタスクはゲージに含めない（今日が期限のタスクのみ対象）
  // - 完了済みタスクはゲージに含めない
  // - デイリールーティンタスクも含める（期限が今日の日付に設定されている）
  // そのため、ここでは "dueDate が存在し、かつ baseDate の範囲内" のタスクのみを抽出する
  const todayTasks = tasks.filter(task => {
    // 完了済みは除外
    if (task.isCompleted) return false;

    // 期限がある場合のみ、今日の範囲内かチェック
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      return dueDate >= baseDate && dueDate < tomorrow;
    }

    // 期限なしのタスクは除外
    return false;
  });

  // 前日が期限で、日をまたぐタスクを抽出（翌日分として当日に加算）
  const yesterdayTasks = tasks.filter(task => {
    if (task.isCompleted) return false;
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      return dueDate >= yesterday && dueDate < baseDate;
    }
    return false;
  });

  // 現在時刻（分単位）- 表示中の日付が今日の場合のみ現在時刻を使用
  const now = new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isToday = formatDateISO(baseDate) === formatDateISO(today);

  // 今日の場合は現在時刻、それ以外の日は0:00を基準にする
  const currentMinutes = isToday ? (now.getHours() * 60 + now.getMinutes()) : 0;

  // 【重要】これから先のタスク時間のみ計算
  let totalDurationMinutes = 0;

  todayTasks.forEach(task => {
    if (task.startTime && task.endTime) {
      const [startHour, startMin] = task.startTime.split(':').map(Number);
      const [endHour, endMin] = task.endTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      let endMinutes = endHour * 60 + endMin;

      // 日をまたぐ場合の処理
      if (endMinutes < startMinutes) {
        // タスクが日をまたぐ場合、当日分（開始時刻から24:00まで）のみを計算
        const todayPortion = (24 * 60) - startMinutes;

        // 現在時刻より後のタスクのみカウント
        if (startMinutes >= currentMinutes) {
          // まだ始まっていないタスク: 当日分の全時間をカウント
          totalDurationMinutes += todayPortion;
        } else if ((24 * 60) > currentMinutes) {
          // 現在進行中のタスク: 残り時間のみカウント（24:00まで）
          totalDurationMinutes += (24 * 60) - currentMinutes;
        }
      } else {
        // 日をまたがない通常のタスク
        // 現在時刻より後のタスクのみカウント
        if (endMinutes > currentMinutes) {
          if (startMinutes >= currentMinutes) {
            // まだ始まっていないタスク: 全時間をカウント
            totalDurationMinutes += endMinutes - startMinutes;
          } else {
            // 現在進行中のタスク: 残り時間のみカウント
            totalDurationMinutes += endMinutes - currentMinutes;
          }
        }
      }
      // 既に終わったタスク（endMinutes <= currentMinutes）はカウントしない

    } else if (task.duration) {
      // duration のみの場合は「これから」やる想定でカウント
      totalDurationMinutes += task.duration;
    }
  });

  // 前日から継続するタスク（今日の0:00以降の部分のみ）
  yesterdayTasks.forEach(task => {
    if (task.startTime && task.endTime) {
      const [startHour, startMin] = task.startTime.split(':').map(Number);
      const [endHour, endMin] = task.endTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      if (endMinutes < startMinutes) {
        // 日をまたぐタスクの今日分
        if (endMinutes > currentMinutes) {
          // まだ終わっていない
          totalDurationMinutes += endMinutes - Math.max(0, currentMinutes);
        }
      }
    }
  });

  // 予定ゲージ更新（時間帯ごとに個別のブロックを作成）
  const scheduledBar = document.getElementById('time-gauge-scheduled');
  scheduledBar.innerHTML = ''; // 既存のブロックをクリア
  scheduledBar.style.display = 'block';
  scheduledBar.style.left = '0';
  scheduledBar.style.width = '100%';

  // 各タスクを時間帯ごとにブロックとして表示
  const taskBlocks = [];

  todayTasks.forEach(task => {
    if (task.startTime && task.endTime) {
      const [startHour, startMin] = task.startTime.split(':').map(Number);
      const [endHour, endMin] = task.endTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      if (endMinutes < startMinutes) {
        // 日をまたぐ場合: 当日分のみ表示
        taskBlocks.push({
          startMinutes: startMinutes,
          endMinutes: 24 * 60,
          task: task
        });
      } else {
        taskBlocks.push({
          startMinutes: startMinutes,
          endMinutes: endMinutes,
          task: task
        });
      }
    }
  });

  // 前日から継続するタスク
  yesterdayTasks.forEach(task => {
    if (task.startTime && task.endTime) {
      const [startHour, startMin] = task.startTime.split(':').map(Number);
      const [endHour, endMin] = task.endTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      if (endMinutes < startMinutes) {
        taskBlocks.push({
          startMinutes: 0,
          endMinutes: endMinutes,
          task: task
        });
      }
    }
  });

  // ブロックを開始時刻順にソート
  taskBlocks.sort((a, b) => a.startMinutes - b.startMinutes);

  // 各ブロックを表示
  taskBlocks.forEach(block => {
    const blockEl = document.createElement('div');
    blockEl.className = 'task-time-block';
    const leftPercent = (block.startMinutes / (24 * 60)) * 100;
    const widthPercent = ((block.endMinutes - block.startMinutes) / (24 * 60)) * 100;
    blockEl.style.left = `${leftPercent}%`;
    blockEl.style.width = `${widthPercent}%`;
    blockEl.dataset.taskId = block.task.id;
    blockEl.dataset.startTime = block.task.startTime;
    blockEl.dataset.endTime = block.task.endTime;

    // 時刻ラベルを追加
    const startHour = Math.floor(block.startMinutes / 60);
    const startMin = block.startMinutes % 60;
    const endHour = Math.floor(block.endMinutes / 60);
    const endMin = block.endMinutes % 60;
    const timeLabel = `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}-${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
    blockEl.dataset.timeLabel = timeLabel;

    // クリックイベント
    blockEl.addEventListener('click', (e) => {
      e.stopPropagation();
      showTimeSlotTasks(block.startMinutes, block.endMinutes);
    });

    scheduledBar.appendChild(blockEl);
  });

  // 【修正】空き時間と密度の計算
  const totalMinutesInDay = 24 * 60;
  // 今日の場合は残り時間、それ以外の日は24時間全体を基準にする
  const remainingTimeInDay = isToday ? (totalMinutesInDay - currentMinutes) : totalMinutesInDay;
  const freeTimeMinutes = remainingTimeInDay - totalDurationMinutes; // 空き時間

  // 自由時間ゲージ更新
  const freeBar = document.getElementById('time-gauge-free');
  if (freeTimeMinutes > 0) {
    const freeStartPercent = (currentMinutes / (24 * 60)) * 100 + (totalDurationMinutes / (24 * 60)) * 100;
    const freeWidthPercent = (freeTimeMinutes / (24 * 60)) * 100;
    freeBar.style.display = 'block';
    freeBar.style.left = `${freeStartPercent}%`;
    freeBar.style.width = `${Math.min(freeWidthPercent, 100 - freeStartPercent)}%`;
  } else {
    freeBar.style.display = 'none';
  }

  // タスク密度を計算して表示
  const remainingElement = document.getElementById('remaining-tasks');
  const gaugeContainer = document.querySelector('.time-gauge-container');

  // 【修正】密度 = これから先のタスク時間 / これから先の時間
  const densityPercent = remainingTimeInDay > 0 ? (totalDurationMinutes / remainingTimeInDay) * 100 : 100;

  // 密度レベルを判定
  let densityLevel = 'green';

  if (densityPercent >= 100) {
    densityLevel = 'red';
  } else if (densityPercent >= 70) {
    densityLevel = 'yellow';
  }

  // ゲージコンテナに密度クラスを設定
  gaugeContainer.classList.remove('density-green', 'density-yellow', 'density-red');
  gaugeContainer.classList.add(`density-${densityLevel}`);

  // 【修正】分かりやすい表示（絵文字なし・モノクロ）
  if (freeTimeMinutes < 0) {
    // タスクが多すぎる場合
    const overMinutes = Math.abs(freeTimeMinutes);
    const overHours = Math.floor(overMinutes / 60);
    const overMins = overMinutes % 60;
    if (overHours > 0) {
      remainingElement.textContent = `時間オーバー: ${overHours}時間${overMins > 0 ? overMins + '分' : ''}`;
    } else {
      remainingElement.textContent = `時間オーバー: ${overMins}分`;
    }

    // 時間オーバー警告を表示（今日の日付の場合のみ）
    if (isToday && typeof openTimeOverloadModal === 'function') {
      // 警告モーダルを表示（1回だけ）
      if (!window.overloadModalShown) {
        window.overloadModalShown = true;
        setTimeout(() => {
          openTimeOverloadModal(freeTimeMinutes, todayTasks);
        }, 500);
      }
    }
  } else {
    // 空き時間を表示
    const hours = Math.floor(freeTimeMinutes / 60);
    const minutes = freeTimeMinutes % 60;

    if (hours > 0) {
      remainingElement.textContent = `空き時間: ${hours}時間${minutes > 0 ? minutes + '分' : ''}`;
    } else if (minutes > 0) {
      remainingElement.textContent = `空き時間: ${minutes}分`;
    } else {
      remainingElement.textContent = `ぴったり（余裕なし）`;
    }
  }

  // 空き時間を記録（今日の日付の場合のみ）
  if (isToday && typeof recordDailyFreeTime === 'function') {
    recordDailyFreeTime(freeTimeMinutes);
  }
}
