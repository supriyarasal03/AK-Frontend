import api from "./axiosClient";

// ---- Lottery (add / view / edit / delete) ----

export async function getLotteries() {
  const response = await api.get("/api/allLotteries");
  return Array.isArray(response.data) ? response.data : [];
}

// payload: { lotteryName, openTimmer, closeTimmer, lotteryRunnningDays, gameDetails }
export async function addLottery(payload) {
  const response = await api.post("/api/addLotteries", payload);
  return response.data;
}

export async function updateLottery(id, payload) {
  const response = await api.put(`/api/lottery/${id}`, payload);
  return response.data;
}

export async function deleteLottery(id) {
  const response = await api.delete(`/api/lotteries/${id}`);
  return response.data;
}

// ---- Results ----
// Backend ही तिन्ही APIs @RequestParam वापरतात, म्हणून values query params म्हणून जातात
// (जुन्या jQuery $.ajax({ data }) सारखेच).

export async function addOpenResult(id, { openResultNo, confirmOpenResultNo, openDate }) {
  const response = await api.post(`/api/addOpenResult/${id}`, null, {
    params: { openOption: "Open", openResultNo, confirmOpenResultNo, openDate },
  });
  return response.data;
}

export async function addCloseResult(id, { closeResultNo, confirmCloseResultNo, closeDate }) {
  const response = await api.post(`/api/addCloseResult/${id}`, null, {
    params: { closeOption: "Close", closeResultNo, confirmCloseResultNo, closeDate },
  });
  return response.data;
}

export async function updateCloseResult(id, { closeResultNo, confirmCloseResultNo, closeDate }) {
  const response = await api.put(`/api/updateCloseResult/${id}`, null, {
    params: { closeOption: "Close", closeResultNo, confirmCloseResultNo, closeDate },
  });
  return response.data;
}
