// データ移行機能
(function() {
  // ページ読み込み後に実行
  window.addEventListener('load', function() {
    addMigrationButton();
  });

  function addMigrationButton() {
    // 設定セクションにボタンを追加
    const settingsSection = document.querySelector('.settings-section') || document.body;

    const migrationDiv = document.createElement('div');
    migrationDiv.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 9999;';
    migrationDiv.innerHTML = `
      <button id="migrationBtn" style="
        background: #4CAF50;
        color: white;
        border: none;
        padding: 15px 20px;
        border-radius: 50%;
        font-size: 24px;
        cursor: pointer;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
      ">📦</button>
    `;

    document.body.appendChild(migrationDiv);

    document.getElementById('migrationBtn').addEventListener('click', showMigrationModal);
  }

  function showMigrationModal() {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    modal.innerHTML = `
      <div style="
        background: white;
        padding: 30px;
        border-radius: 10px;
        max-width: 400px;
        width: 90%;
      ">
        <h2 style="margin-top: 0;">データ移行</h2>
        <p>Webアプリからモバイルアプリへデータを移行します</p>

        <button id="exportBtn" style="
          background: #2196F3;
          color: white;
          border: none;
          padding: 15px;
          border-radius: 5px;
          width: 100%;
          margin-bottom: 10px;
          font-size: 16px;
          cursor: pointer;
        ">LocalStorageをエクスポート</button>

        <button id="importBtn" style="
          background: #4CAF50;
          color: white;
          border: none;
          padding: 15px;
          border-radius: 5px;
          width: 100%;
          margin-bottom: 10px;
          font-size: 16px;
          cursor: pointer;
        ">Firestoreにインポート</button>

        <button id="closeBtn" style="
          background: #f44336;
          color: white;
          border: none;
          padding: 10px;
          border-radius: 5px;
          width: 100%;
          font-size: 16px;
          cursor: pointer;
        ">閉じる</button>

        <textarea id="exportData" style="
          width: 100%;
          height: 200px;
          margin-top: 10px;
          font-family: monospace;
          font-size: 12px;
          display: none;
        "></textarea>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('exportBtn').addEventListener('click', function() {
      exportLocalStorage();
    });

    document.getElementById('importBtn').addEventListener('click', function() {
      importToFirestore();
    });

    document.getElementById('closeBtn').addEventListener('click', function() {
      document.body.removeChild(modal);
    });
  }

  function exportLocalStorage() {
    const exportData = {};
    const keys = [
      'nowtask_tasks',
      'nowtask_trash',
      'nowtask_shelved',
      'nowtask_settings',
      'nowtask_routines',
      'nowtask_task_history',
      'nowtask_templates',
      'nowtask_sort_pref'
    ];

    keys.forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        exportData[key] = data;
      }
    });

    const jsonString = JSON.stringify(exportData, null, 2);
    const textarea = document.getElementById('exportData');
    textarea.style.display = 'block';
    textarea.value = jsonString;

    // クリップボードにコピー
    textarea.select();
    document.execCommand('copy');

    alert('✅ データをエクスポートしました！\n下に表示されています。\nクリップボードにもコピーされました。');
  }

  function importToFirestore() {
    const textarea = document.getElementById('exportData');
    let jsonData = textarea.value;

    if (!jsonData) {
      // テキストエリアが空の場合は、LocalStorageから直接読み込む
      const exportData = {};
      const keys = [
        'nowtask_tasks',
        'nowtask_trash',
        'nowtask_shelved',
        'nowtask_settings',
        'nowtask_routines',
        'nowtask_task_history',
        'nowtask_templates',
        'nowtask_sort_pref'
      ];

      keys.forEach(key => {
        const data = localStorage.getItem(key);
        if (data) {
          exportData[key] = data;
        }
      });

      jsonData = JSON.stringify(exportData);
    }

    if (typeof FirestoreBridge !== 'undefined') {
      FirestoreBridge.importData(jsonData);
      alert('✅ Firestoreへのインポートを開始しました！');
    } else {
      alert('❌ FirestoreBridgeが見つかりません。\nAndroidアプリで実行してください。');
    }
  }
})();
