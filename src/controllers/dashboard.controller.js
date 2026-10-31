
import { getDashboardData } from "../services/dashboard.service.js";

export async function getDashboard(req, res) {
  try {
    const period = Number(req.query.period || 7);

    const allowedPeriods = [7, 30, 90];

    if (!allowedPeriods.includes(period)) {
      return res.status(400).json({
        success: false,
        message: "Periode dashboard harus 7, 30, atau 90 hari",
      });
    }

    const data = await getDashboardData(period);

    return res.status(200).json({
      success: true,
      message: "Data dashboard berhasil diambil",
      data,
    });
  } catch (error) {
    console.error(
      "GET /api/v1/dashboard ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Gagal mengambil data dashboard",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
}
