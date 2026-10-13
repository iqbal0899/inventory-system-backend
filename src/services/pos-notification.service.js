export async function sendRequestStatusNotification({
  requestNumber,
  status,
  reason = null,
}) {
  const secret = process.env.INVENTORY_TRANSFER_SECRET;
  const posApiUrl = process.env.POS_API_URL;

  if (!secret || !posApiUrl) {
    throw new Error(
      "Konfigurasi webhook notifikasi POS belum lengkap"
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
    }),
    signal: AbortSignal.timeout(10000),
  });

  const result = await response.json().catch(() => null);

  console.log("POS NOTIFICATION RESPONSE:", {
  endpoint,
  status: response.status,
  success: result?.success,
  message: result?.message,
});

  if (!response.ok || !result?.success) {
    throw new Error(
      result?.message ||
        `Webhook POS gagal (HTTP ${response.status})`
    );
  }

  return result;
}
