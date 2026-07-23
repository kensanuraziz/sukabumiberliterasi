import { useState, useEffect, useCallback } from 'react';

// In-memory cache to prevent redundant fetches across component mounts
const sheetCache = {};

export function useGoogleSheets(sheetId, sheetName = '') {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSheet = useCallback(async (force = false) => {
    if (!sheetId) return;

    const cacheKey = `${sheetId}-${sheetName}`;

    // Use cache if available and not forced to refetch
    if (!force && sheetCache[cacheKey]) {
      setData(sheetCache[cacheKey]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const sheetParam = sheetName ? `&sheet=${encodeURIComponent(sheetName)}` : '';
      // Use Date.now() only when forcing refetch to bypass browser cache
      const cacheBuster = force ? `&t=${Date.now()}` : '';
      const res = await fetch(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json${sheetParam}${cacheBuster}`);
      
      if (!res.ok) throw new Error('Gagal terhubung dengan server Google Sheets');
      const text = await res.text();
      
      // Extract JSON string from Google's response wrapper
      const jsonStart = text.indexOf('google.visualization.Query.setResponse(');
      if (jsonStart === -1) throw new Error('Format respon spreadsheet tidak valid');
      
      const rawJson = text.substring(jsonStart + 'google.visualization.Query.setResponse('.length, text.length - 2);
      const parsed = JSON.parse(rawJson);
      
      const table = parsed.table;
      if (!table || !table.rows) {
        setData([]);
        sheetCache[cacheKey] = []; // Cache empty result as well
        return;
      }

      // Map column values safely
      const rows = table.rows.map(row => {
        if (!row || !row.c) return [];
        return row.c.map(cell => cell ? cell.v : '');
      });

      sheetCache[cacheKey] = rows; // Save to memory cache
      setData(rows);
    } catch (err) {
      console.error('Error fetching Google Sheet:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [sheetId, sheetName]);

  useEffect(() => {
    fetchSheet();
  }, [fetchSheet]);

  const refetch = () => fetchSheet(true);

  return { data, loading, error, refetch };
}
