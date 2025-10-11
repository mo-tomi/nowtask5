// Firebase初期化とデータ同期
(function() {
  // Firebase設定
  const firebaseConfig = {
    apiKey: "AIzaSyCJR0lvmiXMJyxwD3NmQ0VQAC43f3yk090",
    authDomain: "nowtask-7f9a5.firebaseapp.com",
    projectId: "nowtask-7f9a5",
    storageBucket: "nowtask-7f9a5.firebasestorage.app",
    messagingSenderId: "768185031227",
    appId: "1:768185031227:web:cc9f19eecd4123e2645a1e",
    measurementId: "G-RCL4RZ4ZZD"
  };

  // Firebase初期化
  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();

  let currentUserId = null;
  let isFirebaseReady = false;

  // 匿名認証
  auth.signInAnonymously()
    .then((userCredential) => {
      currentUserId = userCredential.user.uid;
      console.log('Firebase認証成功:', currentUserId);
      isFirebaseReady = true;

      // 認証完了後、Firestoreからデータを読み込む
      loadAllDataFromFirestore();
    })
    .catch((error) => {
      console.error('Firebase認証エラー:', error);
      // エラーでもLocalStorageは使えるので続行
      isFirebaseReady = false;
    });

  // 認証状態の監視
  auth.onAuthStateChanged((user) => {
    if (user) {
      currentUserId = user.uid;
      isFirebaseReady = true;
    } else {
      currentUserId = null;
      isFirebaseReady = false;
    }
  });

  // Firestoreからすべてのデータを読み込み
  function loadAllDataFromFirestore() {
    if (!currentUserId) return;

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
      db.collection('users')
        .doc(currentUserId)
        .collection('nowtask_data')
        .doc(key)
        .get()
        .then((doc) => {
          if (doc.exists) {
            const data = doc.data().data;
            localStorage.setItem(key, data);
            console.log('Firestoreから読み込み:', key);
          }
        })
        .catch((error) => {
          console.error('Firestore読み込みエラー:', key, error);
        });
    });

    // データ読み込み後、UIを更新
    setTimeout(() => {
      if (typeof renderTasks === 'function') {
        renderTasks();
      }
    }, 1000);
  }

  // 元のsaveToStorage関数を拡張
  window.originalSaveToStorage = window.saveToStorage || saveToStorage;
  window.saveToStorage = function(key, data) {
    // LocalStorageに保存
    const result = window.originalSaveToStorage(key, data);

    // Firestoreにも保存
    if (isFirebaseReady && currentUserId) {
      const dataMap = {
        data: JSON.stringify(data),
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      };

      db.collection('users')
        .doc(currentUserId)
        .collection('nowtask_data')
        .doc(key)
        .set(dataMap)
        .then(() => {
          console.log('Firestoreに保存成功:', key);
        })
        .catch((error) => {
          console.error('Firestore保存エラー:', key, error);
        });
    }

    return result;
  };

  // 元のloadFromStorage関数を拡張
  window.originalLoadFromStorage = window.loadFromStorage || loadFromStorage;
  window.loadFromStorage = function(key, defaultValue = []) {
    // まずLocalStorageから読み込み
    const localData = window.originalLoadFromStorage(key, defaultValue);

    // Firestoreから最新データを非同期で取得
    if (isFirebaseReady && currentUserId) {
      db.collection('users')
        .doc(currentUserId)
        .collection('nowtask_data')
        .doc(key)
        .get()
        .then((doc) => {
          if (doc.exists) {
            const data = JSON.parse(doc.data().data);
            localStorage.setItem(key, JSON.stringify(data));

            // データが更新されたら画面を再描画
            if (JSON.stringify(data) !== JSON.stringify(localData)) {
              if (typeof renderTasks === 'function') {
                renderTasks();
              }
            }
          }
        })
        .catch((error) => {
          console.error('Firestore読み込みエラー:', key, error);
        });
    }

    return localData;
  };

  // FirebaseのユーザーIDを取得する関数
  window.getFirebaseUserId = function() {
    return currentUserId || 'anonymous';
  };

  // Firebase準備完了フラグ
  window.isFirebaseReady = function() {
    return isFirebaseReady;
  };

  console.log('Firebase初期化スクリプト読み込み完了');
})();
