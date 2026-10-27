import api from "./axiosClient";

// Pending coin requests (GET /api/admin/coin-requests)
export async function getPendingCoinRequests() {
  const response = await api.get("/api/admin/coin-requests");
  return response.data;
}

// Approve: user च्या coins मध्ये रक्कम जोडली जाते
export async function approveCoinRequest(id) {
  const response = await api.post(`/api/admin/coin-requests/${id}/approve`);
  return response.data;
}

// Reject: फक्त status REJECTED होतो
export async function rejectCoinRequest(id) {
  const response = await api.post(`/api/admin/coin-requests/${id}/reject`);
  return response.data;
}