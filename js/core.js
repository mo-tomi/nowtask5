// ========================================
// 定数定義
// ========================================
const STORAGE_KEYS = {
  TASKS: 'nowtask_tasks',
  TRASH: 'nowtask_trash',
  SHELVED: 'nowtask_shelved',
  SORT_PREFERENCE: 'nowtask_sort_pref',
  SETTINGS: 'nowtask_settings',
  ROUTINES: 'nowtask_routines'
  // 履歴用キー（最新20件を保存）
  ,TASK_HISTORY: 'nowtask_task_history',
  TEMPLATES: 'nowtask_templates'
};

const TRASH_RETENTION_DAYS = 30;

// ========================================
// グローバル変数
// ========================================
let currentTab = 'tasks';
let editingTaskId = null;
// ========================================
// 履歴管理（クイック入力で使う過去のタスク情報）
// ========================================
// 履歴を取得（配列、最新が先頭）
function getTaskHistory(limit = 20) {
  return loadFromStorage(STORAGE_KEYS.TASK_HISTORY, []).slice(0, limit);
}

// 履歴を丸ごと保存
function saveTaskHistory(list) {
  // 最新が先頭であることを期待する
  const toSave = Array.isArray(list) ? list.slice(0, 20) : [];
  return saveToStorage(STORAGE_KEYS.TASK_HISTORY, toSave);
}

// タスク情報を履歴に追加（重複は削除、最新を先頭に、最大 limit 件）
function addToTaskHistory(title, startTime = null, endTime = null, limit = 20) {
  if (!title || typeof title !== 'string') return false;
  const trimmed = title.trim();
  if (trimmed.length === 0) return false;

  const history = loadFromStorage(STORAGE_KEYS.TASK_HISTORY, []);

  // 既存の同一タイトルエントリを取り除く（大文字小文字を区別しない）
  const normalized = history.filter(item => {
    const itemTitle = typeof item === 'string' ? item : (item.title || '');
    return itemTitle.toLowerCase() !== trimmed.toLowerCase();
  });

  // 新しい履歴エントリ（タイトルと時間情報）
  const newEntry = {
    title: trimmed,
    startTime: startTime || null,
    endTime: endTime || null
  };

  // 先頭に追加
  normalized.unshift(newEntry);

  // 上限を超えたら切り詰め
  const limited = normalized.slice(0, limit);
  return saveToStorage(STORAGE_KEYS.TASK_HISTORY, limited);
}
let timerInterval = null;
let editingSubtasks = [];

// ========================================
// ユーティリティ関数
// ========================================

// UUID生成
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// localStorage保存
function saveToStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      alert('ストレージ容量不足です');
    } else {
      console.error('保存エラー:', e);
    }
    return false;
  }
}

// localStorage読み込み
function loadFromStorage(key, defaultValue = []) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (e) {
    console.error('読み込みエラー:', e);
    return defaultValue;
  }
}

// 日時フォーマット
function formatDateTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${month}/${day} ${hours}:${minutes}`;
}

// 期限切れチェック
function isOverdue(dueDate) {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

// 時間フォーマット（秒 → HH:MM:SS）
function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
