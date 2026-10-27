
import axiosClient from "./axiosClient";

const dashboardEndpoints = {
  users: "/api/allUsers",
  lotteries: "/api/allLotteries",
  payments: "/api/payment/all",
  coinRequests: "/api/admin/coin-requests",
  depositRequests: "/api/deposit-requests",
  contacts: "/api/contacts",
};

export async function getAdminDashboardData() {
  const entries = Object.entries(dashboardEndpoints);

  const results = await Promise.allSettled(
    entries.map(([, endpoint]) => axiosClient.get(endpoint))
  );

  const dashboard = {
    users: [],
    lotteries: [],
    payments: [],
    coinRequests: [],
    depositRequests: [],
    contacts: [],
    errors: [],
  };

  results.forEach((result, index) => {
    const [key, endpoint] = entries[index];

    if (result.status === "fulfilled") {
      dashboard[key] = result.value.data;
    } else {
      dashboard.errors.push({
        key,
        endpoint,
        message:
          result.reason?.response?.data?.message ||
          result.reason?.message ||
          "Request failed",
      });

      console.error(
        `Admin dashboard API failed: ${endpoint}`,
        result.reason
      );
    }
  });

  return dashboard;
}
