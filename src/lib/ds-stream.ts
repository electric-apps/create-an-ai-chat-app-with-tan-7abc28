const electricUrl = process.env.ELECTRIC_URL || "https://api.electric-sql.cloud"
const serviceId = process.env.DS_SERVICE_ID
if (!serviceId) {
  // Throw lazily — only when this module is imported on the server
  console.warn("DS_SERVICE_ID is not set; durable streams will 404")
}
export const DS_BASE = `${electricUrl.replace(/\/+$/, "")}/v1/stream/${serviceId}`
export const DS_AUTH: Record<string, string> = {
  Authorization: `Bearer ${process.env.DS_SECRET ?? ""}`,
}
