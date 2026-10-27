import api from "./axiosClient";

// सगळे contact संदेश (GET /api/contacts)
export async function getContacts() {
  const response = await api.get("/api/contacts");
  return response.data;
}

// एक संदेश delete करणे (DELETE /api/contact/{id})
export async function deleteContact(id) {
  const response = await api.delete(`/api/contact/${id}`);
  return response.data;
}