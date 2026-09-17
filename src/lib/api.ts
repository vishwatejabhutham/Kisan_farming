export const API_BASE_URL = "http://localhost:3001/api";

export async function fetchFromBackend(endpoint: string) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch from backend: ${response.statusText}`);
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || "Unknown backend error");
  }

  return result.data !== undefined ? result.data : result;
}
