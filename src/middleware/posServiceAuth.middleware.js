export function posServiceAuthentication(req, res, next) {
  const expectedSecret = process.env.POS_INVENTORY_API_SECRET;
  const receivedSecret = req.get("x-pos-inventory-secret");
  const requesterId = Number(process.env.POS_REQUESTER_USER_ID);

  console.log("POS service auth dipanggil:", {
    secretConfigured: Boolean(expectedSecret),
    headerReceived: Boolean(receivedSecret),
    secretMatches: Boolean(
      expectedSecret && receivedSecret === expectedSecret
    ),
    requesterIdValid:
      Number.isSafeInteger(requesterId) && requesterId > 0,
  });

  if (!expectedSecret) {
    return res.status(500).json({
      success: false,
      message: "POS_INVENTORY_API_SECRET belum dikonfigurasi di Inventory",
    });
  }

  if (!receivedSecret || receivedSecret !== expectedSecret) {
    return res.status(401).json({
      success: false,
      message: "Secret integrasi POS tidak valid",
    });
  }

  if (!Number.isSafeInteger(requesterId) || requesterId <= 0) {
    return res.status(500).json({
      success: false,
      message: "POS_REQUESTER_USER_ID harus berupa satu ID user yang valid",
    });
  }

  req.user = {
    userId: requesterId,
    role: "STAFF",
  };

  next();
}