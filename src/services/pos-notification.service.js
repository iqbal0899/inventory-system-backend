
export async function sendRequestStatusNotification({
  requestNumber,
  status,
  reason = null,
  processedByUsername,
}) {
  const secret = process.env.INVENTORY_TRANSFER_SECRET;
  const posApiUrl = process.env.POS_API_URL;

  if (!secret || !posApiUrl) {
    throw new Error(
      "Konfigurasi webhook notifikasi POS belum lengkap"
    );
  }

  if (!processedByUsername?.trim()) {
    throw new Error(
      "Username user yang memproses request wajib diisi"
    );
  }

  const baseUrl = posApiUrl.replace(/\/+$/, "");
  const endpoint = `${baseUrl}/api/v1/inventory/request-status-notification`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-inventory-transfer-secret": secret,
    },
    body: JSON.stringify({
      requestNumber,
      status,
      reason,
      processedByUsername: processedByUsername.trim(),
    }),
    signal: AbortSignal.timeout(10000),
  });

  const result = await response.json().catch(() => null);

  console.log("POS NOTIFICATION RESPONSE:", {
    endpoint,
    httpStatus: response.status,
    success: result?.success,
    message: result?.message,
    processedByUsername,
  });

  if (!response.ok || !result?.success) {
    throw new Error(
      result?.message ||
        `Webhook POS gagal (HTTP ${response.status})`
    );
  }

  return result;
}
