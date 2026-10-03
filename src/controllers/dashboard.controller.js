import { getDashboardData } from "../services/dashboard.service.js";

export async function getDashboard(req, res) {
  try {
    const data = await getDashboardData();

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