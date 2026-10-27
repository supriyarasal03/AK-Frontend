import api from "./axiosClient";

// सगळे payment (QR) records (GET /api/payment/all)
export async function getPayments() {
  const response = await api.get("/api/payment/all");
  return response.data;
}

// नवीन payment + QR image upload (POST /api/payment, multipart/form-data)
// formData मध्ये: adminName, adminMobileNo, qrCode (file)
export async function addPayment(formData) {
  const response = await api.post("/api/payment", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

// एक payment delete करणे (DELETE /api/payment/{id})
export async function deletePayment(id) {
  const response = await api.delete(`/api/payment/${id}`);
  return response.data;
}