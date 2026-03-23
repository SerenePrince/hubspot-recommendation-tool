import { useState, useCallback } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

console.log('API Base URL:', API_BASE_URL);

export function useWebsiteAnalysis() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const analyzeUrl = useCallback(async (url, includeMeta = false) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        url,
        pretty: 'true',
        ...(includeMeta && { includeMeta: '1' }),
      });

      const response = await fetch(`${API_BASE_URL}/analyze?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        setError(data.error || 'Analysis failed');
        setResult(null);
        return null;
      }
      
      console.log(JSON.stringify(data));

      setResult(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(message);
      setResult(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { analyzeUrl, loading, error, result };
}