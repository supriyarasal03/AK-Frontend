import api from "./axiosClient";


export async function getUsers() {
  const response = await api.get("/api/allUsers");
  return response.data;
}


export async function deleteUser(id) {
  const response = await api.delete(`/api/users/${id}`);
  return response.data;
}