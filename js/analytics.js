// ========================================
// データ分析機能
// ========================================

/**
 * タスクランキングを取得（完了したタスクをtotalTimeでソート）
 * @returns {Array} TOP5のタスクリスト
 */
function getTaskRanking() {
  const tasks = getAllTasks();

  // 完了したタスクのみを抽出し、totalTimeでソート
  const completedTasks = tasks
    .filter(task => task.completed && task.totalTime > 0)
    .sort((a, b) => b.totalTime - a.totalTime)
    .slice(0, 5); // TOP5のみ

  return completedTasks;
}

/**
 * タスクランキングをHTMLに描画
 */
function renderTaskRanking() {
  const ranking = getTaskRanking();
  const container = document.getElementById('task-ranking-list');

  if (!container) return;

  // ランキングが空の場合
  if (ranking.length === 0) {
    container.innerHTML = '<div class="empty-analytics">まだ完了したタスクがありません</div>';
    return;
  }

  // ランキングを描画
  container.innerHTML = ranking.map((task, index) => {
    const position = index + 1;
    let positionClass = '';
    let medal = '';

    if (position === 1) {
      positionClass = 'gold';
      medal = '🥇';
    } else if (position === 2) {
      positionClass = 'silver';
      medal = '🥈';
    } else if (position === 3) {
      positionClass = 'bronze';
      medal = '🥉';
    }

    const hours = Math.floor(task.totalTime / 3600);
    const minutes = Math.floor((task.totalTime % 3600) / 60);
    const timeText = hours > 0 ? `${hours}時間${minutes}分` : `${minutes}分`;

    return `
      <div class="ranking-item">
        <div class="ranking-position ${positionClass}">${medal || position}</div>
        <div class="ranking-info">
          <div class="ranking-task-name">${escapeHtml(task.title)}</div>
        </div>
        <div class="ranking-time">${timeText}</div>
      </div>
    `;
  }).join('');
}

/**
 * 毎日の空き時間を記録
 * @param {number} freeMinutes - 空き時間（分）
 */
function recordDailyFreeTime(freeMinutes) {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD形式

  // localStorageから既存のデータを取得
  const storedData = localStorage.getItem('nowtask_daily_free_time');
  const data = storedData ? JSON.parse(storedData) : {};

  // 今日のデータを更新
  data[today] = freeMinutes;

  // localStorageに保存
  localStorage.setItem('nowtask_daily_free_time', JSON.stringify(data));
}

/**
 * 指定期間の平均空き時間を計算
 * @param {number} days - 過去何日分を計算するか
 * @returns {number} 平均空き時間（分）
 */
function calculateAverageFreeTime(days) {
  const storedData = localStorage.getItem('nowtask_daily_free_time');
  if (!storedData) return 0;

  const data = JSON.parse(storedData);
  const dates = Object.keys(data).sort().reverse(); // 新しい順にソート

  if (dates.length === 0) return 0;

  // 指定日数分のデータを取得
  const targetDates = dates.slice(0, days);
  const sum = targetDates.reduce((acc, date) => acc + data[date], 0);

  return targetDates.length > 0 ? Math.round(sum / targetDates.length) : 0;
}

/**
 * 空き時間統計を描画
 */
function renderFreeTimeStats() {
  const container = document.getElementById('free-time-stats');
  if (!container) return;

  const storedData = localStorage.getItem('nowtask_daily_free_time');

  // データが存在しない場合
  if (!storedData) {
    container.innerHTML = '<div class="empty-analytics">まだ空き時間のデータがありません</div>';
    return;
  }

  const data = JSON.parse(storedData);
  const today = new Date().toISOString().split('T')[0];
  const todayFreeTime = data[today] || 0;

  const avg7Days = calculateAverageFreeTime(7);
  const avg30Days = calculateAverageFreeTime(30);
  const allDates = Object.keys(data);
  const avgAllTime = allDates.length > 0
    ? Math.round(Object.values(data).reduce((a, b) => a + b, 0) / allDates.length)
    : 0;

  // 時間と分に変換するヘルパー関数
  const formatTime = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return { hours: h, minutes: m };
  };

  const todayTime = formatTime(todayFreeTime);
  const avg7Time = formatTime(avg7Days);
  const avg30Time = formatTime(avg30Days);
  const avgAllTimeFormatted = formatTime(avgAllTime);

  container.innerHTML = `
    <div class="stat-card">
      <div class="stat-label">今日の空き時間</div>
      <div>
        <span class="stat-value">${todayTime.hours}</span>
        <span class="stat-unit">時間</span>
        <span class="stat-value">${todayTime.minutes}</span>
        <span class="stat-unit">分</span>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-label">7日間平均</div>
      <div>
        <span class="stat-value">${avg7Time.hours}</span>
        <span class="stat-unit">時間</span>
        <span class="stat-value">${avg7Time.minutes}</span>
        <span class="stat-unit">分</span>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-label">30日間平均</div>
      <div>
        <span class="stat-value">${avg30Time.hours}</span>
        <span class="stat-unit">時間</span>
        <span class="stat-value">${avg30Time.minutes}</span>
        <span class="stat-unit">分</span>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-label">全期間平均</div>
      <div>
        <span class="stat-value">${avgAllTimeFormatted.hours}</span>
        <span class="stat-unit">時間</span>
        <span class="stat-value">${avgAllTimeFormatted.minutes}</span>
        <span class="stat-unit">分</span>
      </div>
    </div>
  `;
}

/**
 * 分析モーダルを開く
 */
function openAnalyticsModal() {
  const modal = document.getElementById('analytics-modal');
  if (!modal) return;

  // データを描画
  renderTaskRanking();
  renderFreeTimeStats();

  // モーダルを表示
  modal.classList.add('show');
}

/**
 * 分析モーダルを閉じる
 */
function closeAnalyticsModal() {
  const modal = document.getElementById('analytics-modal');
  if (!modal) return;

  modal.classList.remove('show');
}

/**
 * HTMLエスケープ
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
