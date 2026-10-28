import axios from "axios";

const api = axios.create({
  baseURL: "",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

const ADMIN_LOGIN_URL = "/api/admin/login";

function inAdminArea() {
  return window.location.pathname.startsWith("/admin");
}

// Backend चे काही APIs (/api/addAdmin, /api/allAdmins, /api/admins/**) फक्त
// "Authorization: Bearer <token>" असलेल्या ADMIN role ला परवानगी देतात.
// त्यामुळे admin पानांवर adminToken, बाकी ठिकाणी userToken पाठवतो.
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(inAdminArea() ? "adminToken" : "userToken");

  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Admin token ची मुदत (1 तास) संपली तर 401 येतो -> admin login ला पाठवतो.
// (Login चा स्वतःचा 401 = चुकीचा password, त्याला वगळतो.)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || "";

    if (
      error.response?.status === 401 &&
      inAdminArea() &&
      !url.includes(ADMIN_LOGIN_URL)
    ) {
      sessionStorage.removeItem("adminToken");
      sessionStorage.removeItem("adminUser");
      window.location.replace("/admin/login");
    }

    return Promise.reject(error);
  }
);

export default api;
