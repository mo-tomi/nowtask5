// ========================================
// 24時間ゲージ
// ========================================

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
  const tasks = getTasks();
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

  const tomorrow = new Date(baseDate);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const yesterday = new Date(baseDate);
  yesterday.setDate(yesterday.getDate() - 1);

  // 変更点の説明（日本語コメント）:
  // - 期限なしタスクはゲージに含めない（今日が期限のタスクのみ対象）
  // - 完了済みタスクはゲージに含めない
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

  // 開始時刻・終了時刻を使用したタスクの当日分の所要時間を計算
  let totalDurationMinutes = 0;

  todayTasks.forEach(task => {
    if (task.startTime && task.endTime) {
      // 開始時刻と終了時刻が指定されている場合
      const [startHour, startMin] = task.startTime.split(':').map(Number);
      const [endHour, endMin] = task.endTime.split(':').map(Number);

      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      if (endMinutes < startMinutes) {
        // 日をまたぐ場合: 当日は開始時刻から24:00まで
        totalDurationMinutes += (24 * 60) - startMinutes;
      } else {
        // 同日内の場合
        totalDurationMinutes += endMinutes - startMinutes;
      }
    } else if (task.duration) {
      // 開始・終了時刻が未設定の場合はdurationを使用
      totalDurationMinutes += task.duration;
    }
  });

  // 前日から日をまたいで当日に継続するタスクの翌日分を加算
  yesterdayTasks.forEach(task => {
    if (task.startTime && task.endTime) {
      const [startHour, startMin] = task.startTime.split(':').map(Number);
      const [endHour, endMin] = task.endTime.split(':').map(Number);

      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      if (endMinutes < startMinutes) {
        // 日をまたぐ場合: 当日は0:00から終了時刻まで
        totalDurationMinutes += endMinutes;
      }
    }
  });

  // 現在時刻から開始して、未完了タスクの所要時間分のゲージを表示
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // 予定ゲージ更新
  const scheduledBar = document.getElementById('time-gauge-scheduled');
  if (totalDurationMinutes === 0) {
    scheduledBar.style.display = 'none';
  } else {
    // ゲージの開始位置と幅を計算
    const startPercent = (currentMinutes / (24 * 60)) * 100;
    const durationPercent = (totalDurationMinutes / (24 * 60)) * 100;

    scheduledBar.style.display = 'block';
    scheduledBar.style.left = `${startPercent}%`;
    scheduledBar.style.width = `${Math.min(durationPercent, 100 - startPercent)}%`;
  }

  // 自由時間を計算: 24時間 - 経過時間 - 予定タスク時間
  const totalMinutesInDay = 24 * 60;
  const currentMinutesFromMidnight = now.getHours() * 60 + now.getMinutes();
  const freeTimeMinutes = totalMinutesInDay - currentMinutesFromMidnight - totalDurationMinutes;

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

  // 自由時間を表示
  const remainingElement = document.getElementById('remaining-tasks');

  if (freeTimeMinutes < 0) {
    // 予定がオーバーしている場合
    const overMinutes = Math.abs(freeTimeMinutes);
    const overHours = Math.floor(overMinutes / 60);
    const overMins = overMinutes % 60;
    if (overHours > 0) {
      remainingElement.textContent = overMins > 0 ? `超過: ${overHours}時間${overMins}分` : `超過: ${overHours}時間`;
    } else {
      remainingElement.textContent = `超過: ${overMins}分`;
    }
  } else {
    // 自由時間を表示
    const hours = Math.floor(freeTimeMinutes / 60);
    const minutes = freeTimeMinutes % 60;

    if (hours > 0) {
      remainingElement.textContent = minutes > 0 ? `自由: ${hours}時間${minutes}分` : `自由: ${hours}時間`;
    } else if (minutes > 0) {
      remainingElement.textContent = `自由: ${minutes}分`;
    } else {
      remainingElement.textContent = '自由: 0分';
    }
  }
}
