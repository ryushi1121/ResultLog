import { useAuth } from './useAuth';
import { parseEvent, formatEvent } from '../utils/calendarParser';

const API_BASE = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

export const useCalendar = () => {
  const { getAccessToken, logout } = useAuth();

  const getHeaders = () => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('ログインしていません');
    }
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  const handleResponse = async (response) => {
    if (response.status === 401) {
      logout();
      throw new Error('セッションの有効期限が切れました。再度ログインしてください。');
    }
    if (!response.ok) {
      const errProps = await response.json().catch(() => ({}));
      throw new Error(errProps?.error?.message || 'API通信エラーが発生しました');
    }
    // Delete validation has empty response body (204)
    if (response.status === 204) {
      return null;
    }
    return response.json();
  };

  const fetchEntries = async (timeMin, timeMax) => {
    const fetchWithQuery = async (queryTerm) => {
      let url = `${API_BASE}?q=${encodeURIComponent(queryTerm)}&maxResults=2500&singleEvents=true&orderBy=startTime`;
      
      if (timeMin) {
        const minDate = new Date(timeMin);
        url += `&timeMin=${minDate.toISOString()}`;
      }
      if (timeMax) {
        const maxDate = new Date(timeMax);
        maxDate.setDate(maxDate.getDate() + 1);
        url += `&timeMax=${maxDate.toISOString()}`;
      }
      const response = await fetch(url, { headers: getHeaders() });
      return handleResponse(response);
    };

    const [dataNew, dataOld] = await Promise.all([
      fetchWithQuery('ResultLog'),
      fetchWithQuery('収支管理')
    ]);

    const items = [...(dataNew?.items || []), ...(dataOld?.items || [])];
    const uniqueItems = Array.from(new Map(items.map(item => [item.id, item])).values());

    // Parse Google events into app entries
    const entries = uniqueItems
      .map(parseEvent)
      .filter(entry => entry !== null); // remove nulls from parser errors

    return entries.sort((a, b) => new Date(b.date) - new Date(a.date)); // descending date
  };

  const createEntry = async (entryData) => {
    const payload = formatEvent(entryData);
    
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    
    const data = await handleResponse(response);
    return parseEvent(data); // return the newly parsed entry
  };

  const updateEntry = async (id, entryData) => {
    const payload = formatEvent(entryData);
    
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    
    const data = await handleResponse(response);
    return parseEvent(data);
  };

  const deleteEntry = async (id) => {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    await handleResponse(response);
    return true;
  };

  return {
    fetchEntries,
    createEntry,
    updateEntry,
    deleteEntry
  };
};
