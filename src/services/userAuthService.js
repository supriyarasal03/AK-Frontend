import api from "./axiosClient";

const userAuthService = {
  login: async (loginData) => {
    const response = await api.post("/api/login", loginData);
    return response.data;
  },

  register: async (signupData) => {
    const response = await api.post("/api/users", signupData);
    return response.data;
  },

  // Step 1: send OTP to the user's email
  forgotPassword: async (userEmail) => {
    const response = await api.post("/api/forgot-password", { userEmail });
    return response.data;
  },

  // Step 2: verify OTP and set the new password
  resetPassword: async (resetData) => {
    const response = await api.post("/api/reset-password", resetData);
    return response.data;
  },
};

export default userAuthService;