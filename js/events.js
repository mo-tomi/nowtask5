// ========================================
// イベントリスナー設定
// ========================================

function initEventListeners() {

  // X共有アイコン
  document.getElementById('share-icon-btn').addEventListener('click', () => {
    generateAndShareImage();
  });

  // 設定アイコン
  document.getElementById('settings-icon-btn').addEventListener('click', () => {
    openSettingsModal();
  });

  // 設定モーダルを閉じる
  document.getElementById('close-settings-btn').addEventListener('click', () => {
    closeSettingsModal();
  });

  // 分析アイコン
  const analyticsIconBtn = document.getElementById('analytics-icon-btn');
  if (analyticsIconBtn) {
    analyticsIconBtn.addEventListener('click', () => {
      if (typeof openAnalyticsModal === 'function') {
        openAnalyticsModal();
      }
    });
  }

  // 分析モーダルを閉じる
  const closeAnalyticsBtn = document.getElementById('close-analytics-btn');
  if (closeAnalyticsBtn) {
    closeAnalyticsBtn.addEventListener('click', () => {
      if (typeof closeAnalyticsModal === 'function') {
        closeAnalyticsModal();
      }
    });
  }

  // 分析モーダル外クリックで閉じる
  const analyticsModal = document.getElementById('analytics-modal');
  if (analyticsModal) {
    analyticsModal.addEventListener('click', (e) => {
      if (e.target.id === 'analytics-modal') {
        if (typeof closeAnalyticsModal === 'function') {
          closeAnalyticsModal();
        }
      }
    });
  }

  // テンプレート選択ボタン
  const templateSelectBtn = document.getElementById('template-select-btn');
  if (templateSelectBtn) {
    const handleTemplateOpen = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (typeof openTemplateModal === 'function') {
        openTemplateModal();
      }
    };
    templateSelectBtn.addEventListener('click', handleTemplateOpen);
    templateSelectBtn.addEventListener('touchend', handleTemplateOpen);
  }

  // テンプレートモーダルを閉じる
  const closeTemplateBtn = document.getElementById('close-template-btn');
  const templateCloseBtn = document.getElementById('template-close-btn');
  if (closeTemplateBtn) {
    closeTemplateBtn.addEventListener('click', () => {
      if (typeof closeTemplateModal === 'function') {
        closeTemplateModal();
      }
    });
  }
  if (templateCloseBtn) {
    templateCloseBtn.addEventListener('click', () => {
      if (typeof closeTemplateModal === 'function') {
        closeTemplateModal();
      }
    });
  }

  // テンプレートモーダル外クリックで閉じる
  const templateModal = document.getElementById('template-modal');
  if (templateModal) {
    templateModal.addEventListener('click', (e) => {
      if (e.target.id === 'template-modal') {
        if (typeof closeTemplateModal === 'function') {
          closeTemplateModal();
        }
      }
    });
  }

  // テンプレート追加ボタン（フォーム表示）
  const addTemplateBtn = document.getElementById('add-template-btn');
  if (addTemplateBtn) {
    const handleAddTemplate = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (typeof showTemplateInputForm === 'function') {
        showTemplateInputForm();
      }
    };
    addTemplateBtn.addEventListener('click', handleAddTemplate);
    addTemplateBtn.addEventListener('touchend', handleAddTemplate);
  }

  // テンプレートフォーム保存ボタン
  const templateSaveBtn = document.getElementById('template-save-btn');
  if (templateSaveBtn) {
    const handleTemplateSave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (typeof saveTemplateFromForm === 'function') {
        saveTemplateFromForm();
      }
    };
    templateSaveBtn.addEventListener('click', handleTemplateSave);
    templateSaveBtn.addEventListener('touchend', handleTemplateSave);
  }

  // テンプレートフォームキャンセルボタン
  const templateCancelBtn = document.getElementById('template-cancel-btn');
  if (templateCancelBtn) {
    const handleTemplateCancel = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (typeof hideTemplateInputForm === 'function') {
        hideTemplateInputForm();
      }
    };
    templateCancelBtn.addEventListener('click', handleTemplateCancel);
    templateCancelBtn.addEventListener('touchend', handleTemplateCancel);
  }

  // カレンダーアイコン
  const calendarIconBtn = document.getElementById('calendar-icon-btn');
  if (calendarIconBtn) {
    calendarIconBtn.addEventListener('click', () => {
      if (typeof openCalendarModal === 'function') {
        openCalendarModal();
      }
    });
  }

  // カレンダーモーダルを閉じる
  const closeCalendarBtn = document.getElementById('close-calendar-btn');
  if (closeCalendarBtn) {
    closeCalendarBtn.addEventListener('click', () => {
      if (typeof closeCalendarModal === 'function') {
        closeCalendarModal();
      }
    });
  }

  // カレンダーモーダル外クリックで閉じる
  const calendarModal = document.getElementById('calendar-modal');
  if (calendarModal) {
    calendarModal.addEventListener('click', (e) => {
      if (e.target.id === 'calendar-modal') {
        if (typeof closeCalendarModal === 'function') {
          closeCalendarModal();
        }
      }
    });
  }

  // カレンダーナビゲーション
  const calendarPrevBtn = document.getElementById('calendar-prev-btn');
  const calendarNextBtn = document.getElementById('calendar-next-btn');
  if (calendarPrevBtn) {
    calendarPrevBtn.addEventListener('click', () => {
      if (typeof goToPreviousMonth === 'function') {
        goToPreviousMonth();
      }
    });
  }
  if (calendarNextBtn) {
    calendarNextBtn.addEventListener('click', () => {
      if (typeof goToNextMonth === 'function') {
        goToNextMonth();
      }
    });
  }

  // 設定保存
  document.getElementById('save-settings-btn').addEventListener('click', () => {
    saveSettings();
  });

  // ルーティン追加
  document.getElementById('add-routine-btn').addEventListener('click', () => {
    addRoutine();
  });

  // 完了済み折りたたみ
  const completedToggle = document.getElementById('completed-toggle');
  const completedContent = document.getElementById('completed-content');
  completedToggle.addEventListener('click', () => {
    completedToggle.classList.toggle('open');
    completedContent.classList.toggle('open');
  });

  // FAB（新規作成）
  document.getElementById('create-task-btn').addEventListener('click', () => {
    openCreateModal();
  });

  // モーダル閉じる
  document.getElementById('close-modal-btn').addEventListener('click', () => {
    closeModal();
  });

  document.getElementById('cancel-btn').addEventListener('click', () => {
    closeModal();
  });

  // モーダル外クリックで閉じる
  document.getElementById('task-modal').addEventListener('click', (e) => {
    if (e.target.id === 'task-modal') {
      closeModal();
    }
  });

  document.getElementById('settings-modal').addEventListener('click', (e) => {
    if (e.target.id === 'settings-modal') {
      closeSettingsModal();
    }
  });

  // 保存ボタン
  const saveBtnElement = document.getElementById('save-btn');
  const handleSaveTask = (e) => {
    e.preventDefault();
    e.stopPropagation();
    saveTask();
  };
  saveBtnElement.addEventListener('click', handleSaveTask);
  saveBtnElement.addEventListener('touchend', handleSaveTask);

  // 削除ボタン
  document.getElementById('delete-btn').addEventListener('click', () => {
    deleteCurrentTask();
  });

  // タイトル入力時の文字数カウント
  const titleInput = document.getElementById('task-title');
  titleInput.addEventListener('input', () => {
    const count = titleInput.value.length;
    document.getElementById('title-char-count').textContent = count;
    document.getElementById('save-btn').disabled = count === 0;
  });

  // タイマーボタン
  document.getElementById('timer-toggle-btn').addEventListener('click', (e) => {
    e.preventDefault();
    if (!editingTaskId) return;

    const task = getTaskById(editingTaskId);
    if (!task) return;

    if (task.isTimerRunning) {
      stopTimer(editingTaskId);
    } else {
      startTimer(editingTaskId);
    }

    updateTimerDisplay(editingTaskId);
  });

  // Enterキーで保存（タイトル入力時）
  titleInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && titleInput.value.trim()) {
      saveTask();
    }
  });

  // クイック入力
  const quickInput = document.getElementById('quick-add-input');
  const quickAddForm = document.getElementById('quick-add-form');
  const quickDateBtn = document.getElementById('quick-date-btn');
  const quickDatetimePanel = document.getElementById('quick-datetime-panel');
  const quickDateInput = document.getElementById('quick-add-date');
  const quickDuration = document.getElementById('quick-add-duration');
  const quickDatetimeClose = document.getElementById('quick-datetime-close');
  const quickHistoryBtn = document.getElementById('quick-history-btn');
  const quickHistoryTags = document.getElementById('quick-history-tags');

  // カレンダーボタンのクリック
  if (quickDateBtn) {
    quickDateBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (quickDatetimePanel.style.display === 'none') {
        quickDatetimePanel.style.display = 'block';
      } else {
        quickDatetimePanel.style.display = 'none';
      }
    });
  }

  // 日時パネルを閉じる
  if (quickDatetimeClose) {
    quickDatetimeClose.addEventListener('click', (e) => {
      e.preventDefault();
      quickDatetimePanel.style.display = 'none';
    });
  }

  // 日時選択時
  if (quickDateInput) {
    quickDateInput.addEventListener('change', () => {
      if (quickDateInput.value) {
        quickDateBtn.classList.add('has-date');
      } else {
        quickDateBtn.classList.remove('has-date');
      }
    });
  }

  // パネルの外側クリックで閉じる
  document.addEventListener('click', (e) => {
    if (quickDatetimePanel && !quickDatetimePanel.contains(e.target) && quickDateBtn && !quickDateBtn.contains(e.target)) {
      quickDatetimePanel.style.display = 'none';
    }
  });

  if (quickAddForm) {
    quickAddForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (quickInput.value.trim()) {
      const title = quickInput.value.trim();
      const durationValue = quickDuration ? quickDuration.value : '';
      const duration = durationValue ? parseInt(durationValue) : null;

      // 期限日のみ（時刻なし）
      let dueDate = null;
      if (quickDateInput.value) {
        dueDate = new Date(quickDateInput.value + 'T00:00:00').toISOString();
      } else {
        // 日付未指定の場合は今日の日付を設定
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        dueDate = new Date(`${year}-${month}-${day}T00:00:00`).toISOString();
      }

      // 新規タスク作成
      const tasks = getTasks();
      const now = new Date().toISOString();
      const task = {
        id: generateUUID(),
        title: title,
        memo: '',
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
        startTime: null,
        endTime: null,
        urgent: false,
        priority: ''
      };
      tasks.unshift(task);
      saveTasks(tasks);

      // 履歴に追加
      if (typeof addToTaskHistory === 'function') {
        addToTaskHistory(task.title, null, null, 20);
        try {
          document.dispatchEvent(new CustomEvent('task:history:updated'));
        } catch (e) {
          console.warn('CustomEvent dispatch failed', e);
        }
      }

      quickInput.value = '';
      quickDateInput.value = '';
      if (quickDuration) quickDuration.value = '';
      quickDatetimePanel.style.display = 'none';
      quickDateBtn.classList.remove('has-date');
      renderTasks();
    }
    });
  }

  // ---- 履歴タグの初期化とイベント ----
  function renderHistoryTags() {
    if (!quickHistoryTags) return;
    quickHistoryTags.innerHTML = '';

    const history = typeof getTaskHistory === 'function' ? getTaskHistory(10) : [];
    history.forEach((item) => {
      const itemTitle = typeof item === 'string' ? item : (item.title || '');
      const itemStartTime = typeof item === 'object' ? item.startTime : null;
      const itemEndTime = typeof item === 'object' ? item.endTime : null;

      const tag = document.createElement('button');
      tag.type = 'button';
      tag.className = 'quick-history-tag';
      tag.textContent = itemTitle;
      tag.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        // タスクを即座に作成
        const tasks = getTasks();
        const now = new Date().toISOString();

        // 今日の日付を設定
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayDate = new Date(`${year}-${month}-${day}T00:00:00`).toISOString();

        const task = {
          id: generateUUID(),
          title: itemTitle,
          memo: '',
          dueDate: todayDate,
          isCompleted: false,
          createdAt: now,
          updatedAt: now,
          parentId: null,
          isTutorial: false,
          totalTime: 0,
          isTimerRunning: false,
          timerStartTime: null,
          duration: null,
          startTime: itemStartTime,
          endTime: itemEndTime,
          urgent: false,
          priority: ''
        };
        tasks.unshift(task);
        saveTasks(tasks);

        // 履歴を更新
        if (typeof addToTaskHistory === 'function') {
          addToTaskHistory(task.title, task.startTime, task.endTime, 20);
          try {
            document.dispatchEvent(new CustomEvent('task:history:updated'));
          } catch (e) {
            console.warn('CustomEvent dispatch failed', e);
          }
        }

        renderTasks();
      });

      quickHistoryTags.appendChild(tag);
    });
  }

  // 履歴ボタンのクリック（履歴タグの表示/非表示を切り替え）
  if (quickHistoryBtn) {
    quickHistoryBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      const isVisible = quickHistoryTags.style.display === 'flex';
      if (isVisible) {
        quickHistoryTags.style.display = 'none';
      } else {
        renderHistoryTags();
        quickHistoryTags.style.display = 'flex';
      }
    });
  }

  // 初期描画（最初は非表示）
  if (quickHistoryTags) {
    quickHistoryTags.style.display = 'none';
  }

  // 履歴更新時に再描画
  document.addEventListener('task:history:updated', () => {
    renderHistoryTags();
  });

  // 絞り込みボタン
  const filterUrgentBtn = document.getElementById('filter-urgent');
  const filterHighPriorityBtn = document.getElementById('filter-high-priority');
  const filterClearBtn = document.getElementById('filter-clear');

  if (filterUrgentBtn) {
    filterUrgentBtn.addEventListener('click', () => {
      currentFilter = currentFilter === 'urgent' ? null : 'urgent';
      filterUrgentBtn.classList.toggle('active');
      filterHighPriorityBtn.classList.remove('active');
      renderTasks();
    });
  }

  if (filterHighPriorityBtn) {
    filterHighPriorityBtn.addEventListener('click', () => {
      currentFilter = currentFilter === 'high-priority' ? null : 'high-priority';
      filterHighPriorityBtn.classList.toggle('active');
      filterUrgentBtn.classList.remove('active');
      renderTasks();
    });
  }

  if (filterClearBtn) {
    filterClearBtn.addEventListener('click', () => {
      currentFilter = null;
      filterUrgentBtn.classList.remove('active');
      filterHighPriorityBtn.classList.remove('active');
      renderTasks();
    });
  }

  // サブタスク追加ボタン
  document.getElementById('add-subtask-btn').addEventListener('click', () => {
    addSubtask();
  });

  // 時間オーバー警告モーダルのイベント
  const closeOverloadBtn = document.getElementById('close-overload-btn');
  const overloadCancelBtn = document.getElementById('overload-cancel-btn');
  const overloadAdjustBtn = document.getElementById('overload-adjust-btn');
  const timeOverloadModal = document.getElementById('time-overload-modal');

  if (closeOverloadBtn) {
    closeOverloadBtn.addEventListener('click', () => {
      if (typeof closeTimeOverloadModal === 'function') {
        closeTimeOverloadModal();
      }
    });
  }

  if (overloadCancelBtn) {
    overloadCancelBtn.addEventListener('click', () => {
      if (typeof closeTimeOverloadModal === 'function') {
        closeTimeOverloadModal();
      }
    });
  }

  if (overloadAdjustBtn) {
    overloadAdjustBtn.addEventListener('click', () => {
      // 調整ボタンは現在モーダルを閉じるだけ（タスク一覧で個別に調整）
      if (typeof closeTimeOverloadModal === 'function') {
        closeTimeOverloadModal();
      }
    });
  }

  if (timeOverloadModal) {
    timeOverloadModal.addEventListener('click', (e) => {
      if (e.target.id === 'time-overload-modal') {
        if (typeof closeTimeOverloadModal === 'function') {
          closeTimeOverloadModal();
        }
      }
    });
  }

  // スクロール連動で24時間ゲージを更新（スロットリング）
  const tasksListContainer = document.querySelector('.main-content');
  if (tasksListContainer) {
    let lastCall = 0;
    const throttleMs = 150;
    let scrollTimeout = null;
    let isScrolling = false;

    tasksListContainer.addEventListener('scroll', () => {
      const now = Date.now();
      if (now - lastCall < throttleMs) return;
      lastCall = now;

      // 画面上部に見える最初の date-separator を探す
      const separators = document.querySelectorAll('.date-separator');
      let topMostDate = null;
      let topMostOffset = Infinity;
      separators.forEach(sep => {
        const rect = sep.getBoundingClientRect();
        // ビューポート上部付近（ヘッダーなどを考慮して 80px 下）にあるものを検出
        const offset = Math.abs(rect.top - 80);
        if (rect.top <= 120 && offset < topMostOffset) {
          topMostOffset = offset;
          topMostDate = sep.dataset.date || null;
        }
      });

      // 見つかった日付を渡してゲージを更新
      if (topMostDate !== null) {
        updateTimeGauge(topMostDate || undefined);
      }

      // クイック入力のスクロール時の表示/非表示制御
      if (quickAddForm) {
        // スクロール中はクイック入力を非表示
        if (!isScrolling) {
          isScrolling = true;
          quickAddForm.classList.add('hidden');
        }

        // 既存のタイムアウトをクリア
        if (scrollTimeout) {
          clearTimeout(scrollTimeout);
        }

        // スクロール停止後3秒で再表示
        scrollTimeout = setTimeout(() => {
          isScrolling = false;
          quickAddForm.classList.remove('hidden');
        }, 3000);
      }
    });
  }
}

// タブUIは廃止しました。表示切替は showTasks/showTrash を使用します。
