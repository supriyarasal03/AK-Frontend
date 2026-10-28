import api from "./axiosClient";

// प्रत्येक game type चा स्वतःचा filter endpoint आहे (सगळ्यांचे params सारखे)
const FILTER_ENDPOINTS = {
  "Single Digit": "/api/single-digit/filter",
  "Jodi Digit": "/api/jodi-digit/filter",
  "Single Pana": "/api/single-pana/filter",
  "Double Pana": "/api/double-pana/filter",
  "Triple Pana": "/api/triple-pana/filter",
  "Half Sangam": "/api/half-sangam/filter",
  "Full Sangam": "/api/full-sangam/filter",
};

// entryBidDate: "yyyy-MM-dd"
export async function getLotteryEntries({ lotteryName, entryGameType, entryBidDate }) {
  const endpoint = FILTER_ENDPOINTS[entryGameType];

  if (!endpoint) {
    throw new Error(`Filter for "${entryGameType}" is not available.`);
  }

  // params वापरल्याने नावात & किंवा space असले तरी URL बरोबर encode होतो
  const response = await api.get(endpoint, {
    params: { lotteryName, entryGameType, entryBidDate },
  });

  const list = Array.isArray(response.data) ? response.data : [];

  // Backend entry सोबत संपूर्ण user object पाठवतो; आपल्याला फक्त हवी तीच फील्ड ठेवतो
  return list.map((entry) => ({
    id: entry.id,
    userName: entry.userName,
    userPhoneNo: entry.userPhoneNo,
    entryGameType: entry.entryGameType,
    entryBidType: entry.entryBidType,
    entryBitNumber: entry.entryBitNumber,
    entryBitPoints: Number(entry.entryBitPoints) || 0,
    winnerStatus: entry.winnerStatus,
  }));
}
