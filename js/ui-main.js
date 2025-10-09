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
    initGaugeDate();
    initGaugeSwipe();
    updateTimeGauge(currentGaugeDate);
    updateGaugeDateLabel();
    setInterval(() => {
      // 現在の日付が変わっていたら今日にリセット
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = formatDateISO(today);
      if (currentGaugeDate === todayISO) {
        updateTimeGauge(currentGaugeDate);
      }
    }, 60000); // 1分ごとに更新

    // 1秒ごとにタスクリストを更新（タイマー表示のため）
    setInterval(() => {
      const tasks = getTasks();
      const hasRunningTimer = tasks.some(t => t.isTimerRunning);
      if (hasRunningTimer) {
        renderTasks();
      }
    }, 1000);

    // スクロール時にヘッダーを隠す
    initHeaderScroll();
  } catch (e) {
    console.error('Initialization error:', e);
    alert('初期化エラーが発生しました。コンソールを確認してください。');
  }
}

// ========================================
// ヘッダースクロール制御
// ========================================
function initHeaderScroll() {
  const header = document.querySelector('.header');
  let lastScrollTop = 0;
  let isScrolling = false;
  let scrollTimeout;

  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;

    // スクロールが停止したかチェック
    clearTimeout(scrollTimeout);
    isScrolling = true;

    // 下スクロール: ヘッダーを隠す
    if (currentScroll > lastScrollTop && currentScroll > 100) {
      header.classList.add('header-hidden');
    }
    // 上スクロール: ヘッダーを表示
    else if (currentScroll < lastScrollTop) {
      header.classList.remove('header-hidden');
    }

    // トップに戻った場合は必ず表示
    if (currentScroll <= 0) {
      header.classList.remove('header-hidden');
    }

    lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;

    // スクロール停止を検知（200ms後）
    scrollTimeout = setTimeout(() => {
      isScrolling = false;
    }, 200);
  }, { passive: true });
}

// DOMロード後に初期化実行
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
