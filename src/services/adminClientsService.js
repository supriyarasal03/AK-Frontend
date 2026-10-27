import api from "./axiosClient";

const MULTIPART = { headers: { "Content-Type": "multipart/form-data" } };

// सगळे clients (GET /api/allClients)
export async function getClients() {
  const response = await api.get("/api/allClients");
  return response.data;
}

// नवीन client + image (POST /api/clients, multipart/form-data)
export async function addClient(formData) {
  const response = await api.post("/api/clients", formData, MULTIPART);
  return response.data;
}

// client बदलणे (PUT /api/updateClient/{id}, multipart/form-data)
// clientImage ऐच्छिक; बाकी सगळी फील्ड्स आवश्यक
export async function updateClient(id, formData) {
  const response = await api.put(`/api/updateClient/${id}`, formData, MULTIPART);
  return response.data;
}

// client delete करणे (DELETE /api/clients/{id})
export async function deleteClient(id) {
  const response = await api.delete(`/api/clients/${id}`);
  return response.data;
}