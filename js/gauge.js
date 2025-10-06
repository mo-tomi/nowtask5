// ========================================
// 24時間ゲージ
// ========================================

// 24時間ゲージ更新
function updateTimeGauge() {
  const now = new Date();
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

  // 今日の予定時間更新
  updateScheduledTasks();
}

// 今日の予定タスク時間を表示
function updateScheduledTasks() {
  const tasks = getTasks();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // 今日の期限があるタスク、または期限はないが所要時間が設定されているタスクを抽出（完了済みも含む）
  const todayTasks = tasks.filter(task => {
    // 期限がある場合は今日の範囲内かチェック
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      return dueDate >= today && dueDate < tomorrow;
    }

    // 期限はないが所要時間が設定されている場合も含める
    return task.duration && task.duration > 0;
  });

  // 未完了タスクのみ（予定ゲージ表示用）
  const incompleteTasks = todayTasks.filter(task => !task.isCompleted);

  // 全タスク（完了済み含む）の所要時間の合計を計算（分単位）
  const totalDurationMinutes = todayTasks.reduce((sum, task) => {
    return sum + (task.duration || 0);
  }, 0);

  // 未完了タスクの所要時間の合計（予定ゲージ表示用）
  const incompleteDurationMinutes = incompleteTasks.reduce((sum, task) => {
    return sum + (task.duration || 0);
  }, 0);

  // 現在時刻から開始して、未完了タスクの所要時間分のゲージを表示
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // 予定ゲージ更新（未完了タスクのみ）
  const scheduledBar = document.getElementById('time-gauge-scheduled');
  if (incompleteDurationMinutes === 0) {
    scheduledBar.style.display = 'none';
  } else {
    // ゲージの開始位置と幅を計算
    const startPercent = (currentMinutes / (24 * 60)) * 100;
    const durationPercent = (incompleteDurationMinutes / (24 * 60)) * 100;

    scheduledBar.style.display = 'block';
    scheduledBar.style.left = `${startPercent}%`;
    scheduledBar.style.width = `${Math.min(durationPercent, 100 - startPercent)}%`; // 24時間を超えないように
  }

  // 自由時間を計算: 24時間 - 経過時間 - 予定タスク時間
  const totalMinutesInDay = 24 * 60; // 1440分
  const currentMinutesFromMidnight = now.getHours() * 60 + now.getMinutes();
  const freeTimeMinutes = totalMinutesInDay - currentMinutesFromMidnight - totalDurationMinutes;

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
