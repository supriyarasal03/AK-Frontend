import api from "./axiosClient";

export async function adminLogin(adminEmail, adminPassword) {
  try {
    const response = await api.post("/api/admin/login", {
      adminEmail,
      adminPassword,
    });

    return response.data;
  } catch (error) {
        const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      (typeof error.response?.data === "string"
        ? error.response.data
        : null) ||
      error.message ||
      "Unable to login. Please try again.";
      throw new Error(message, { cause: error });
  }
}