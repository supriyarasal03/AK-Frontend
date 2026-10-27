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

};

export default userAuthService;