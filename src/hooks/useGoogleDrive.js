import { useState, useCallback } from 'react';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
// drive.file = only files created/opened by this app (least-privilege)
const SCOPE = 'https://www.googleapis.com/auth/drive.file';
const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3';
const FILE_FIELDS = 'id,name,mimeType,modifiedTime,size,webViewLink';

export function useGoogleDrive() {
  const [token,     setToken]     = useState(null);
  const [files,     setFiles]     = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState('');

  const isConfigured = !!CLIENT_ID;
  const connected    = !!token;

  // ── Internal helpers ──────────────────────────────────────────────────────────
  async function apiFetch(url, options = {}) {
    const res = await fetch(url, {
      ...options,
      headers: { Authorization: `Bearer ${token}`, ...options.headers },
    });
    if (res.status === 401) { setToken(null); throw new Error('session_expired'); }
    return res;
  }

  async function loadFiles(accessToken) {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(
        `${DRIVE_API}/files?q=trashed%3Dfalse&fields=files(${FILE_FIELDS})&orderBy=modifiedTime+desc&pageSize=50`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setFiles(data.files || []);
    } catch (e) {
      if (e.message !== 'session_expired') setError('Could not load files. Please reconnect.');
    }
    setLoading(false);
  }

  // ── Public API ────────────────────────────────────────────────────────────────
  const connect = useCallback(() => {
    if (!window.google?.accounts?.oauth2) {
      setError('Google Sign-In is still loading — please try again in a moment.');
      return;
    }
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      callback: async (resp) => {
        if (resp.error) { setError(`Sign-in failed: ${resp.error}`); return; }
        setToken(resp.access_token);
        await loadFiles(resp.access_token);
      },
    });
    client.requestAccessToken({ prompt: '' });
  }, []);

  const disconnect = useCallback(() => {
    if (token && window.google?.accounts?.oauth2) {
      window.google.accounts.oauth2.revoke(token, () => {});
    }
    setToken(null);
    setFiles([]);
    setError('');
  }, [token]);

  const refresh = useCallback(() => {
    if (token) loadFiles(token);
  }, [token]);

  const upload = useCallback(async (file) => {
    if (!token) return;
    setUploading(true);
    setError('');
    try {
      const metadata = { name: file.name };
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', file);

      const res = await fetch(
        `${UPLOAD_API}/files?uploadType=multipart&fields=${FILE_FIELDS}`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form }
      );
      if (!res.ok) throw new Error(await res.text());
      const newFile = await res.json();
      setFiles(prev => [newFile, ...prev]);
    } catch (e) {
      setError('Upload failed — please try again.');
    }
    setUploading(false);
  }, [token]);

  const deleteFile = useCallback(async (fileId) => {
    if (!token) return;
    setError('');
    try {
      const res = await fetch(`${DRIVE_API}/files/${fileId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok && res.status !== 204) throw new Error();
      setFiles(prev => prev.filter(f => f.id !== fileId));
    } catch {
      setError('Could not delete file.');
    }
  }, [token]);

  return { isConfigured, connected, files, loading, uploading, error, connect, disconnect, upload, deleteFile, refresh };
}
