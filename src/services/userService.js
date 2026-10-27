import api from "./axiosClient";

// Login नंतर backend session (JSESSIONID cookie) सेट होते, त्यामुळे हे API
// cookie वरून logged-in user ओळखतात (withCredentials: true आधीच axiosClient मध्ये आहे).

// Logged-in user ची ताजी माहिती (coinsAmount सह)
export async function getSessionUser() {
  const response = await api.get("/api/user/session");
  return response.data;
}

// Admin ने upload केलेला पहिला payment QR code (जुन्या userDashboard प्रमाणेच)
export async function getPaymentQr() {
  const response = await api.get("/api/payment/all");
  const payments = Array.isArray(response.data) ? response.data : [];
  return payments.find((payment) => payment.qrCode)?.qrCode || "";
}

// "Send Coins Request" -> POST /api/coin-requests?amount=  (किमान 10)
export async function sendCoinRequest(amount) {
  const response = await api.post("/api/coin-requests", null, {
    params: { amount },
  });
  return response.data;
}

// "Withdraw Coins Request" -> POST /api/deposit-requests?amount=  (किमान 100)
export async function sendWithdrawRequest(amount) {
  const response = await api.post("/api/deposit-requests", null, {
    params: { amount },
  });
  return response.data;
}





// Logged-in user चा game history (नवीन तारीख आधी, backend ने sort करून पाठवतो)
export async function getGameHistory() {
  const response = await api.get("/api/game-history");
  return Array.isArray(response.data) ? response.data : [];
}
