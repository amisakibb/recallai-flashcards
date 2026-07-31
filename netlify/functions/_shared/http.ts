export const CORS_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function jsonResponse(statusCode: number, data: any) {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(data),
  };
}

export function errorResponse(statusCode: number, message: string) {
  return jsonResponse(statusCode, { error: message });
}

// Wraps a Netlify function handler body: parses the JSON POST body,
// runs the provided service call, and always returns a JSON response -
// so a thrown error never surfaces as Netlify's generic HTML 502 page.
export async function handleAiRequest(
  event: { httpMethod: string; body: string | null },
  run: (body: any) => Promise<any>
) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return errorResponse(405, "Method not allowed. Use POST.");
  }

  let body: any = {};
  try {
    body = event.body ? JSON.parse(event.body) : {};
  } catch (e) {
    return errorResponse(400, "Invalid JSON payload.");
  }

  try {
    const data = await run(body);
    return jsonResponse(200, data);
  } catch (err: any) {
    console.error("AI function error:", err?.message || err);
    return errorResponse(err?.status || 500, err?.message || "Request failed.");
  }
}
