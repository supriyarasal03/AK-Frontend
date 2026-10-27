import api from "./axiosClient";

// Pending deposit (withdrawal) requests (GET /api/deposit-requests)
export async function getPendingDepositRequests() {
  const response = await api.get("/api/deposit-requests");
  return response.data;
}

// Approve: user च्या coins मधून रक्कम वजा होते
export async function approveDepositRequest(id) {
  const response = await api.post(`/api/deposit-requests/${id}/approve`);
  return response.data;
}

// Reject: फक्त status REJECTED होतो
export async function rejectDepositRequest(id) {
  const response = await api.post(`/api/deposit-requests/${id}/reject`);
  return response.data;
}