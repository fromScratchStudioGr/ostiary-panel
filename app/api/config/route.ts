import { connection } from "next/server";
import { getAdminApiUrl } from "@/app/lib/admin-api-url";

export async function GET() {
  await connection();
  return Response.json(
    { apiUrl: getAdminApiUrl(), version: process.env.VERSION || "dev" },
    { headers: { "Cache-Control": "no-store" } }
  );
}
