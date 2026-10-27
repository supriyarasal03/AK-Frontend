// axios error मधून वाचता येईल असा message काढतो
export default function getErrorMessage(error, fallback = "Something went wrong") {
  const data = error?.response?.data;

  return (
    data?.error ||
    data?.message ||
    (typeof data === "string" && data ? data : null) ||
    fallback
  );
}
