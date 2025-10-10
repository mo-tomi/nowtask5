// ========================================
// X共有機能
// ========================================

/**
 * 今日のタスクデータを取得して共有用のテキストを生成
 */
function generateShareData() {
  const tasks = getTasks();
  const today = new Date();
  const todayDateStr = today.toISOString().split('T')[0];

  const baseDate = new Date();
  baseDate.setHours(0, 0, 0, 0);

  const tomorrow = new Date(baseDate);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // 今日のタスクを抽出（完了済みを除く）
  const todayTasks = tasks.filter(task => {
    if (task.isCompleted || task.parentId) return false;
    if (!task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    return dueDate >= baseDate && dueDate < tomorrow;
  });

  // 全てのタスク（完了済みを含む）
  const allTodayTasks = tasks.filter(task => {
    if (task.parentId) return false;
    if (!task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    return dueDate >= baseDate && dueDate < tomorrow;
  });

  // 完了済みと未完了を分ける
  const completedTasks = allTodayTasks.filter(t => t.isCompleted);
  const incompleteTasks = allTodayTasks.filter(t => !t.isCompleted);

  // 現在時刻（分単位）
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // これから先のタスク時間を計算（gauge.jsと同じロジック）
  let totalDurationMinutes = 0;

  todayTasks.forEach(task => {
    if (task.startTime && task.endTime) {
      const [startHour, startMin] = task.startTime.split(':').map(Number);
      const [endHour, endMin] = task.endTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      let endMinutes = endHour * 60 + endMin;

      // 日をまたぐ場合の処理
      if (endMinutes < startMinutes) {
        const todayPortion = (24 * 60) - startMinutes;
        if (startMinutes >= currentMinutes) {
          totalDurationMinutes += todayPortion;
        } else if ((24 * 60) > currentMinutes) {
          totalDurationMinutes += (24 * 60) - currentMinutes;
        }
      } else {
        if (endMinutes > currentMinutes) {
          if (startMinutes >= currentMinutes) {
            totalDurationMinutes += endMinutes - startMinutes;
          } else {
            totalDurationMinutes += endMinutes - currentMinutes;
          }
        }
      }
    } else if (task.duration) {
      totalDurationMinutes += task.duration;
    }
  });

  // 残り時間から空き時間を計算
  const totalMinutesInDay = 24 * 60;
  const remainingTimeInDay = totalMinutesInDay - currentMinutes;
  const freeMinutes = remainingTimeInDay - totalDurationMinutes;
  const freeHours = Math.floor(freeMinutes / 60);
  const freeMinutesRemainder = freeMinutes % 60;

  return {
    todayTasks: allTodayTasks,
    completedTasks,
    incompleteTasks,
    freeHours,
    freeMinutes: freeMinutesRemainder,
    totalScheduledMinutes: totalDurationMinutes
  };
}

/**
 * 共有用のHTML要素を生成
 */
function createShareElement() {
  const data = generateShareData();
  const today = new Date();
  const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;

  // 共有用のコンテナを作成
  const shareContainer = document.createElement('div');
  shareContainer.id = 'share-container';
  shareContainer.style.cssText = `
    position: fixed;
    top: -9999px;
    left: -9999px;
    width: 600px;
    background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
    padding: 40px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  `;

  // ヘッダー部分
  const header = document.createElement('div');
  header.style.cssText = `
    text-align: center;
    margin-bottom: 32px;
  `;
  header.innerHTML = `
    <h1 style="font-size: 32px; font-weight: 700; color: #000; margin: 0 0 8px 0;">nowtask</h1>
    <p style="font-size: 16px; color: #666; margin: 0;">${dateStr}</p>
  `;

  // 空き時間カード
  const freeTimeCard = document.createElement('div');
  freeTimeCard.style.cssText = `
    background: white;
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 24px;
    text-align: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  `;
  freeTimeCard.innerHTML = `
    <p style="font-size: 14px; color: #666; margin: 0 0 8px 0;">今日の空き時間</p>
    <p style="font-size: 48px; font-weight: 700; color: #000; margin: 0;">
      ${data.freeHours}<span style="font-size: 24px;">時間</span>${data.freeMinutes}<span style="font-size: 24px;">分</span>
    </p>
  `;

  // タスク統計カード
  const statsCard = document.createElement('div');
  statsCard.style.cssText = `
    background: white;
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  `;
  statsCard.innerHTML = `
    <div style="display: flex; justify-content: space-around; text-align: center;">
      <div>
        <p style="font-size: 32px; font-weight: 700; color: #000; margin: 0 0 4px 0;">${data.todayTasks.length}</p>
        <p style="font-size: 12px; color: #666; margin: 0;">総タスク数</p>
      </div>
      <div style="width: 1px; background: #e0e0e0;"></div>
      <div>
        <p style="font-size: 32px; font-weight: 700; color: #4caf50; margin: 0 0 4px 0;">${data.completedTasks.length}</p>
        <p style="font-size: 12px; color: #666; margin: 0;">完了</p>
      </div>
      <div style="width: 1px; background: #e0e0e0;"></div>
      <div>
        <p style="font-size: 32px; font-weight: 700; color: #ff9800; margin: 0 0 4px 0;">${data.incompleteTasks.length}</p>
        <p style="font-size: 12px; color: #666; margin: 0;">未完了</p>
      </div>
    </div>
  `;

  // タスクリストカード（未完了タスクのみ、最大5件）
  const taskListCard = document.createElement('div');
  taskListCard.style.cssText = `
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  `;

  const taskListTitle = document.createElement('h3');
  taskListTitle.style.cssText = `
    font-size: 16px;
    font-weight: 600;
    color: #000;
    margin: 0 0 16px 0;
  `;
  taskListTitle.textContent = '今日の予定';

  const taskList = document.createElement('div');
  const displayTasks = data.incompleteTasks.slice(0, 5);

  if (displayTasks.length === 0) {
    taskList.innerHTML = `<p style="color: #999; text-align: center; font-size: 14px;">未完了タスクはありません</p>`;
  } else {
    displayTasks.forEach((task, index) => {
      const taskItem = document.createElement('div');
      taskItem.style.cssText = `
        padding: 12px 0;
        border-bottom: ${index < displayTasks.length - 1 ? '1px solid #f0f0f0' : 'none'};
        display: flex;
        justify-content: space-between;
        align-items: center;
      `;

      const taskTitle = document.createElement('span');
      taskTitle.style.cssText = `
        font-size: 14px;
        color: #333;
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      `;
      taskTitle.textContent = task.title;

      const taskTime = document.createElement('span');
      taskTime.style.cssText = `
        font-size: 12px;
        color: #999;
        margin-left: 12px;
      `;
      if (task.startTime) {
        taskTime.textContent = task.startTime.substring(0, 5);
      } else if (task.duration) {
        const hours = Math.floor(task.duration / 60);
        const minutes = task.duration % 60;
        if (hours > 0) {
          taskTime.textContent = `${hours}時間${minutes > 0 ? minutes + '分' : ''}`;
        } else {
          taskTime.textContent = `${minutes}分`;
        }
      }

      taskItem.appendChild(taskTitle);
      taskItem.appendChild(taskTime);
      taskList.appendChild(taskItem);
    });

    if (data.incompleteTasks.length > 5) {
      const moreText = document.createElement('p');
      moreText.style.cssText = `
        text-align: center;
        color: #999;
        font-size: 12px;
        margin: 12px 0 0 0;
      `;
      moreText.textContent = `他 ${data.incompleteTasks.length - 5} 件`;
      taskList.appendChild(moreText);
    }
  }

  taskListCard.appendChild(taskListTitle);
  taskListCard.appendChild(taskList);

  // フッター
  const footer = document.createElement('div');
  footer.style.cssText = `
    text-align: center;
    margin-top: 24px;
    padding-top: 24px;
    border-top: 1px solid #ddd;
  `;
  footer.innerHTML = `<p style="font-size: 12px; color: #999; margin: 0;">Generated by nowtask</p>`;

  // すべての要素を追加
  shareContainer.appendChild(header);
  shareContainer.appendChild(freeTimeCard);
  shareContainer.appendChild(statsCard);
  shareContainer.appendChild(taskListCard);
  shareContainer.appendChild(footer);

  return shareContainer;
}

/**
 * 共有画像を生成してダウンロード
 */
async function generateAndShareImage() {
  try {
    // 共有用の要素を作成してDOMに追加
    const shareElement = createShareElement();
    document.body.appendChild(shareElement);

    // html2canvasで画像化
    const canvas = await html2canvas(shareElement, {
      backgroundColor: null,
      scale: 2,
      logging: false
    });

    // 要素を削除
    document.body.removeChild(shareElement);

    // Canvasを画像に変換
    canvas.toBlob(async (blob) => {
      if (!blob) {
        alert('画像の生成に失敗しました');
        return;
      }

      // Web Share APIが使用可能かチェック
      if (navigator.share && navigator.canShare) {
        try {
          const file = new File([blob], 'nowtask-share.png', { type: 'image/png' });

          // 共有可能かチェック
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              text: '今日のタスク管理 #nowtask'
            });
          } else {
            // ファイル共有が使えない場合は画像をダウンロード
            downloadImage(blob);
          }
        } catch (err) {
          // キャンセルされた場合やエラーの場合
          if (err.name !== 'AbortError') {
            console.error('共有エラー:', err);
            downloadImage(blob);
          }
        }
      } else {
        // Web Share APIが使えない場合は画像をダウンロード
        downloadImage(blob);
      }
    }, 'image/png');
  } catch (error) {
    console.error('画像生成エラー:', error);
    alert('画像の生成に失敗しました');
  }
}

/**
 * 画像をダウンロード
 */
function downloadImage(blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `nowtask-${new Date().toISOString().split('T')[0]}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  alert('画像をダウンロードしました。Xにアップロードしてください。');
}
