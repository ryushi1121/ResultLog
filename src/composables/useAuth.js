import { ref, shallowRef, readonly } from 'vue'

// ── 状態（モジュールスコープでシングルトン） ──
const isLoggedIn = ref(false)
const user = ref(null)
const accessToken = ref(null)
const tokenClient = shallowRef(null)
const isInitialized = ref(false)
const authError = ref('')

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_CLIENT_ID.apps.googleusercontent.com'
const SCOPES = 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email'

let refreshTimer = null
let pendingRefreshResolve = null
let pendingRefreshReject = null

export function useAuth() {

  function initializeGIS() {
    return new Promise((resolve, reject) => {
      if (isInitialized.value) { resolve(); return }

      const checkGIS = () => {
        if (window.google && window.google.accounts && window.google.accounts.oauth2) {
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

      setTimeout(() => reject(new Error('Google Identity Services の読み込みがタイムアウトしました')), 5000)
      checkGIS()
    })
  }

  // 5分前に自動リフレッシュをスケジュール
  function scheduleTokenRefresh(expiresInSeconds) {
    if (refreshTimer) clearTimeout(refreshTimer)
    const delay = Math.max(0, expiresInSeconds - 300) * 1000
    refreshTimer = setTimeout(() => tryRefreshSilently(), delay)
  }

  // サイレントリフレッシュ（Promise を返す）
  // 同時に複数から呼ばれても GIS リクエストは1回だけ発行する
  function tryRefreshSilently() {
    if (pendingRefreshResolve) {
      // 既にリフレッシュ中 → 同じ Promise に相乗り
      return new Promise((resolve, reject) => {
        const origResolve = pendingRefreshResolve
        const origReject = pendingRefreshReject
        pendingRefreshResolve = (...args) => { origResolve(...args); resolve(...args) }
        pendingRefreshReject = (...args) => { origReject(...args); reject(...args) }
      })
    }

    return new Promise(async (resolve, reject) => {
      try {
        await initializeGIS()
        if (!tokenClient.value) { reject(new Error('GIS not available')); return }

        pendingRefreshResolve = resolve
        pendingRefreshReject = reject

        const hint = localStorage.getItem('google_user_email') || ''
        tokenClient.value.requestAccessToken({ prompt: 'none', hint })

        // 10 秒以内に応答がなければタイムアウト
        setTimeout(() => {
          if (pendingRefreshResolve === resolve) {
            pendingRefreshResolve = null
            pendingRefreshReject = null
            reject(new Error('Silent refresh timeout'))
          }
        }, 10000)
      } catch (e) {
        pendingRefreshResolve = null
        pendingRefreshReject = null
        reject(e)
      }
    })
  }

  function handleTokenResponse(response) {
    const resolve = pendingRefreshResolve
    const reject = pendingRefreshReject
    pendingRefreshResolve = null
    pendingRefreshReject = null

    if (response.error) {
      authError.value = '認証エラーが発生しました。'
      if (reject) reject(new Error(response.error))
      logout()
      return
    }

    const hasAccess = window.google.accounts.oauth2.hasGrantedAllScopes(
      response,
      'https://www.googleapis.com/auth/calendar'
    )

    if (!hasAccess) {
      if (response.access_token) {
        window.google.accounts.oauth2.revoke(response.access_token, () => {})
      }
      authError.value = '収支データを保存するため、カレンダーへのアクセス権限が必要です。チェックボックスをオンにして再度ログインしてください。'
      if (reject) reject(new Error('Insufficient scope'))
      return
    }

    authError.value = ''
    accessToken.value = response.access_token
    localStorage.setItem('google_access_token', response.access_token)

    const expiresIn = response.expires_in || 3600
    localStorage.setItem('google_token_expires_at', String(Date.now() + expiresIn * 1000))
    scheduleTokenRefresh(expiresIn)

    // Promise を解決してから非同期でユーザー情報を取得
    if (resolve) resolve()

    fetchUserInfo(response.access_token)
  }

  function handleTokenError(error) {
    console.error('Token request error:', error)
    const reject = pendingRefreshReject
    pendingRefreshResolve = null
    pendingRefreshReject = null

    if (reject) {
      // サイレントリフレッシュ失敗 → 呼び出し元（useCalendar）がログアウト・リダイレクトを担当
      reject(new Error('Silent refresh failed'))
    }
    // 通常ログインのキャンセル（reject が null）はここで何もしない
  }

  async function fetchUserInfo(token) {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('ユーザー情報の取得に失敗しました')
      const data = await response.json()
      user.value = { name: data.name, email: data.email, picture: data.picture }
      isLoggedIn.value = true
      localStorage.setItem('google_user', JSON.stringify(user.value))
      localStorage.setItem('google_user_email', data.email)
    } catch (error) {
      console.error('UserInfo fetch error:', error)
    }
  }

  async function login() {
    try {
      await initializeGIS()
      if (!tokenClient.value) throw new Error('Token client が初期化されていません')
      tokenClient.value.requestAccessToken({ prompt: 'consent' })
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  function logout() {
    if (refreshTimer) { clearTimeout(refreshTimer); refreshTimer = null }

    const token = accessToken.value || localStorage.getItem('google_access_token')
    if (token && window.google && window.google.accounts) {
      window.google.accounts.oauth2.revoke(token, () => {})
    }

    isLoggedIn.value = false
    user.value = null
    accessToken.value = null
    localStorage.removeItem('google_access_token')
    localStorage.removeItem('google_token_expires_at')
    localStorage.removeItem('google_user')
    localStorage.removeItem('google_user_email')
  }

  function restoreSession() {
    const savedToken = localStorage.getItem('google_access_token')
    const savedUser = localStorage.getItem('google_user')
    const expiresAt = parseInt(localStorage.getItem('google_token_expires_at') || '0')

    if (!savedToken || !savedUser) return

    accessToken.value = savedToken
    user.value = JSON.parse(savedUser)
    isLoggedIn.value = true

    const remainingSeconds = (expiresAt - Date.now()) / 1000
    if (remainingSeconds < 300) {
      tryRefreshSilently().catch(() => {
        // リフレッシュ失敗は useCalendar の 401 リトライ時に対処する
      })
    } else {
      scheduleTokenRefresh(remainingSeconds)
    }
  }

  function getAccessToken() {
    return accessToken.value || localStorage.getItem('google_access_token')
  }

  restoreSession()

  return {
    isLoggedIn: readonly(isLoggedIn),
    user: readonly(user),
    accessToken: readonly(accessToken),
    authError: readonly(authError),
    login,
    logout,
    getAccessToken,
    refreshTokenSilently: tryRefreshSilently
  }
}
