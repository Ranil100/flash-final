// frontend/src/lib/api.ts
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL; // pulls from your .env

export async function fetchWithRetry(
  path: string,
  options: RequestInit = {},
  retries = 6,
  delayMs = 5000
): Promise<Response> {
  const url = `${BACKEND_URL}${path}`;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      throw new Error(`Status ${response.status}`);
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise((res) => setTimeout(res, delayMs));
    }
  }
  throw new Error("Backend unreachable after retries");
}
