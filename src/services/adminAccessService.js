import api from "./axiosClient";

// ही 3 APIs फक्त ROLE_ADMIN साठी आहेत, म्हणून admin चा token पाठवावा लागतो
const authConfig = () => ({
  headers: {
    Authorization: `Bearer ${sessionStorage.getItem("adminToken")}`,
  },
});

// सगळे admins (GET /api/allAdmins) -> { id, adminName, adminEmail }
export async function getAdmins() {
  const response = await api.get("/api/allAdmins", authConfig());
  return response.data;
}

// नवीन admin (POST /api/addAdmin)
export async function addAdmin(data) {
  const response = await api.post("/api/addAdmin", data, authConfig());
  return response.data;
}

// admin बदलणे (PUT /api/admins/{id}); password रिकामा असेल तर जुना तसाच राहतो
export async function updateAdmin(id, data) {
  const response = await api.put(`/api/admins/${id}`, data, authConfig());
  return response.data;
}

// admin delete करणे (DELETE /api/admins/{id})
export async function deleteAdmin(id) {
  await api.delete(`/api/admins/${id}`, authConfig());
}