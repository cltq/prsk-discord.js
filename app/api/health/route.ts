import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const filePath = join(process.cwd(), "status-data.json");
    const raw = await readFile(filePath, "utf-8");
    const data = JSON.parse(raw);
    const ok = data.status === "Online";
    return new NextResponse(ok ? "200 ok" : "503 disconnected", {
      status: ok ? 200 : 503,
    });
  } catch {
    return new NextResponse("503 disconnected", { status: 503 });
  }
}
