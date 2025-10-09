// ========================================
// メイン初期化ファイル
// ========================================

// ========================================
// 初期化
// ========================================
function init() {
  try {
    // チュートリアル初期化
    initTutorial();

    // ゴミ箱クリーンアップ
    cleanupTrash();

    // デイリールーティンタスク作成
    try {
      createDailyRoutineTasks();
    } catch (e) {
      console.warn('Failed to create daily routine tasks:', e);
    }

    // イベントリスナー設定
    initEventListeners();

    // 初回レンダリング
    renderTasks();

    // 24時間ゲージの初期化と更新
    updateTimeGauge();
    setInterval(updateTimeGauge, 60000); // 1分ごとに更新

    // 1秒ごとにタスクリストを更新（タイマー表示のため）
    setInterval(() => {
      const tasks = getTasks();
      const hasRunningTimer = tasks.some(t => t.isTimerRunning);
      if (hasRunningTimer) {
        renderTasks();
      }
    }, 1000);
  } catch (e) {
    console.error('Initialization error:', e);
    alert('初期化エラーが発生しました。コンソールを確認してください。');
  }
}

// DOMロード後に初期化実行
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
