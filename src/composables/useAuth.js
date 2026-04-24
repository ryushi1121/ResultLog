import { ref, shallowRef, readonly } from 'vue'

// ── 状態（モジュールスコープでシングルトン） ──
const isLoggedIn = ref(false)
const user = ref(null)
const accessToken = ref(null)
const tokenClient = shallowRef(null)
const isInitialized = ref(false)
const authError = ref('') // エラーメッセージ用ステート

// Google Cloud Console で作成したクライアントID
// TODO: 実際のクライアントIDに差し替えてください
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_CLIENT_ID.apps.googleusercontent.com'
const SCOPES = 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email'

/**
 * Google OAuth認証 composable
 * Google Identity Services (GIS) を使用してOAuth 2.0トークンを取得
 */
export function useAuth() {

  /**
   * GISライブラリの初期化
   * index.htmlで読み込んだscriptが利用可能になるまで待機
   */
  function initializeGIS() {
    return new Promise((resolve, reject) => {
      if (isInitialized.value) {
        resolve()
        return
      }

      const checkGIS = () => {
        if (window.google && window.google.accounts && window.google.accounts.oauth2) {
          // Token Client の初期化
          tokenClient.value = window.google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: handleTokenResponse,
            error_callback: handleTokenError
          })
          isInitialized.value = true
          resolve()
        } else {
          setTimeout(checkGIS, 100)
        }
      }

      // 3秒以内にロードされなければタイムアウト
      const timeout = setTimeout(() => {
        reject(new Error('Google Identity Services の読み込みがタイムアウトしました'))
      }, 5000)

      checkGIS()
    })
  }

  /**
   * トークンレスポンスのコールバック
   */
  function handleTokenResponse(response) {
    if (response.error) {
      console.error('Token error:', response.error)
      authError.value = '認証エラーが発生しました。'
      return
    }

    // スコープの確認（Googleカレンダーへのアクセス権が許可されているか）
    const hasAccess = window.google.accounts.oauth2.hasGrantedAllScopes(
      response,
      'https://www.googleapis.com/auth/calendar'
    )

    if (!hasAccess) {
      // 不十分な権限で発行されたトークンを破棄する
      if (response.access_token) {
        window.google.accounts.oauth2.revoke(response.access_token, () => {})
      }
      authError.value = '収支データを保存するため、カレンダーへのアクセス権限が必要です。チェックボックスをオンにして再度ログインしてください。'
      return
    }

    authError.value = '' // エラーをクリア
    accessToken.value = response.access_token
    localStorage.setItem('google_access_token', response.access_token)

    // ユーザー情報を取得
    fetchUserInfo(response.access_token)
  }

  /**
   * トークンエラーのコールバック
   */
  function handleTokenError(error) {
    console.error('Token request error:', error)
  }

  /**
   * ユーザー情報を Google UserInfo API から取得
   */
  async function fetchUserInfo(token) {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('ユーザー情報の取得に失敗しました')

      const data = await response.json()
      user.value = {
        name: data.name,
        email: data.email,
        picture: data.picture
      }
      isLoggedIn.value = true

      // セッションに保存
      localStorage.setItem('google_user', JSON.stringify(user.value))
    } catch (error) {
      console.error('UserInfo fetch error:', error)
    }
  }

  /**
   * ログイン処理
   * GISのトークンリクエストダイアログを表示
   */
  async function login() {
    try {
      await initializeGIS()

      if (!tokenClient.value) {
        throw new Error('Token client が初期化されていません')
      }

      // ユーザーに承認ダイアログを表示
      tokenClient.value.requestAccessToken({ prompt: 'consent' })
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  /**
   * ログアウト処理
   */
  function logout() {
    const token = accessToken.value || localStorage.getItem('google_access_token')

    // Googleのトークンを取り消し
    if (token && window.google && window.google.accounts) {
      window.google.accounts.oauth2.revoke(token, () => {
        console.log('Token revoked')
      })
    }

    // 状態をクリア
    isLoggedIn.value = false
    user.value = null
    accessToken.value = null
    localStorage.removeItem('google_access_token')
    localStorage.removeItem('google_user')
  }

  /**
   * セッションからの復元を試みる
   */
  function restoreSession() {
    const savedToken = localStorage.getItem('google_access_token')
    const savedUser = localStorage.getItem('google_user')

    if (savedToken && savedUser) {
      accessToken.value = savedToken
      user.value = JSON.parse(savedUser)
      isLoggedIn.value = true

      // トークンの有効性を確認
      validateToken(savedToken)
    }
  }

  /**
   * トークンの有効性を確認
   */
  async function validateToken(token) {
    try {
      const response = await fetch(
        `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${token}`
      )

      if (!response.ok) {
        // トークンが無効 → サイレントログインを試みるか、ログアウト
        console.warn('Token is invalid, logging out')
        logout()
      }
    } catch {
      console.warn('Token validation failed')
      logout()
    }
  }

  /**
   * アクセストークンを取得（APIコール用）
   * トークンがない場合はnullを返す
   */
  function getAccessToken() {
    return accessToken.value || localStorage.getItem('google_access_token')
  }

  // 初回呼び出し時にセッション復元
  restoreSession()

  return {
    isLoggedIn: readonly(isLoggedIn),
    user: readonly(user),
    accessToken: readonly(accessToken),
    authError: readonly(authError),
    login,
    logout,
    getAccessToken,
    restoreSession
  }
}
