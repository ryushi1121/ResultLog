import { useAuth } from './useAuth';
import { parseEvent, formatEvent } from '../utils/calendarParser';

const API_BASE = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

export const useCalendar = () => {
  const { getAccessToken, logout, refreshTokenSilently } = useAuth();

  const getHeaders = () => {
    const token = getAccessToken();
    if (!token) throw new Error('ログインしていません');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  const handleResponse = async (response) => {
    if (!response.ok) {
      const errProps = await response.json().catch(() => ({}));
      throw new Error(errProps?.error?.message || 'API通信エラーが発生しました');
    }
    if (response.status === 204) return null;
    return response.json();
  };

  // 401 時にサイレントリフレッシュしてリトライ、それでも失敗したらログアウト
  const fetchWithRetry = async (url, options = {}) => {
    let response = await fetch(url, { ...options, headers: getHeaders() });

    if (response.status === 401) {
      try {
        await refreshTokenSilently();
        response = await fetch(url, { ...options, headers: getHeaders() });
      } catch {
        logout();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        throw new Error('セッションの有効期限が切れました。再ログインしてください。');
      }
    }

    return handleResponse(response);
  };

  const fetchEntries = async (timeMin = null, timeMax = null) => {
    const buildUrl = (queryTerm) => {
      let url = `${API_BASE}?q=${encodeURIComponent(queryTerm)}&maxResults=2500&singleEvents=true&orderBy=startTime`;
      if (timeMin) url += `&timeMin=${new Date(timeMin).toISOString()}`;
      if (timeMax) {
        const maxDate = new Date(timeMax);
        maxDate.setDate(maxDate.getDate() + 1);
        url += `&timeMax=${maxDate.toISOString()}`;
      }
      return url;
    };

    const [dataNew, dataOld] = await Promise.all([
      fetchWithRetry(buildUrl('ResultLog')),
      fetchWithRetry(buildUrl('収支管理'))
    ]);

    const items = [...(dataNew?.items || []), ...(dataOld?.items || [])];
    const uniqueItems = Array.from(new Map(items.map(item => [item.id, item])).values());

    return uniqueItems
      .map(parseEvent)
      .filter(entry => entry !== null)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const createEntry = async (entryData) => {
    const data = await fetchWithRetry(API_BASE, {
      method: 'POST',
      body: JSON.stringify(formatEvent(entryData))
    });
    return parseEvent(data);
  };

  const updateEntry = async (id, entryData) => {
    const data = await fetchWithRetry(`${API_BASE}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(formatEvent(entryData))
    });
    return parseEvent(data);
  };

  const deleteEntry = async (id) => {
    await fetchWithRetry(`${API_BASE}/${id}`, { method: 'DELETE' });
    return true;
  };

  return { fetchEntries, createEntry, updateEntry, deleteEntry };
};
