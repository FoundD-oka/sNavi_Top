// Google認証とGAS API通信を管理するファイル

// Google Client IDを設定（実際のClient IDに置き換えてください）
const GOOGLE_CLIENT_ID = '396737896899-fsg5tdvm14gbbjuqs4dq4d0vs4hm72p3.apps.googleusercontent.com';

// GASアプリのデプロイメントURL
const GAS_DEPLOYMENT_URL = 'https://script.google.com/macros/s/AKfycbyECiCsy8vcWC8WOBzdQCJndJwtEccOWKuCZIWUhxR8qiJY15CrYQu6ludHFHOFX8cn/exec';

// 認証状態を保持する変数
let idToken = null;
let userProfile = null;

// Google APIのロード完了後に実行される関数
function handleGoogleLoad() {
  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleCredentialResponse,
    auto_select: false,
    cancel_on_tap_outside: true
  });

  // One Tap UIの表示
  google.accounts.id.prompt((notification) => {
    if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
      // One Tapが表示されない場合は明示的なサインインボタンを表示
      showSignInButton();
    }
  });
}

// 明示的なサインインボタンを表示する関数
function showSignInButton() {
  google.accounts.id.renderButton(
    document.getElementById('google-signin-button'), 
    { 
      theme: 'outline', 
      size: 'large',
      text: 'signin_with',
      shape: 'rectangular'
    }
  );
  document.getElementById('google-signin-container').style.display = 'block';
}

// Google認証のコールバック関数
function handleCredentialResponse(response) {
  // レスポンスからIDトークンを取得
  idToken = response.credential;

  // ユーザー情報を取得
  fetchUserInfo();
  
  // サインイン成功表示
  document.getElementById('google-signin-container').style.display = 'none';
  document.getElementById('user-info-container').style.display = 'block';
}

// ユーザー情報をGASから取得する関数
async function fetchUserInfo() {
  try {
    const response = await callGasApi('getUserInfo');
    if (response.success) {
      userProfile = response.user;
      // ユーザー情報を表示
      const userInfoElement = document.getElementById('user-info');
      userInfoElement.textContent = `${userProfile.name}さん、こんにちは！`;
    } else {
      console.error('ユーザー情報の取得に失敗しました:', response.error);
      showError('ユーザー情報の取得に失敗しました');
    }
  } catch (error) {
    console.error('APIリクエストエラー:', error);
    showError('サーバーとの通信中にエラーが発生しました');
  }
}

// GAS APIを呼び出す汎用関数
async function callGasApi(action, additionalData = {}) {
  if (!idToken) {
    throw new Error('認証されていません。再度ログインしてください。');
  }

  try {
    // リクエストデータの準備
    const requestData = {
      idToken: idToken,
      action: action,
      ...additionalData
    };

    // POSTリクエストの送信
    const response = await fetch(GAS_DEPLOYMENT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    });

    // レスポンスの処理
    if (!response.ok) {
      throw new Error(`HTTPエラー: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('APIリクエストエラー:', error);
    showError('サーバーとの通信中にエラーが発生しました');
    throw error;
  }
}

// エラーメッセージを表示する関数
function showError(message) {
  const errorElement = document.getElementById('error-message');
  errorElement.textContent = message;
  errorElement.style.display = 'block';
  
  // 5秒後にエラーメッセージを非表示にする
  setTimeout(() => {
    errorElement.style.display = 'none';
  }, 5000);
}

// ページ読み込み完了時の初期化
window.onload = function() {
  // Google APIのスクリプトが読み込まれたら初期化する
  if (typeof google !== 'undefined') {
    handleGoogleLoad();
  }
};

// 外部から呼び出せる関数をエクスポート
export { callGasApi, idToken }; 