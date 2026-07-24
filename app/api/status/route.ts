import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export const dynamic = "force-dynamic";

interface StatusData {
  status: string;
  uptime: number;
  servers: number;
  users: number;
  commands: number;
  timestamp: number;
}

const fallback: StatusData = {
  status: "Offline",
  uptime: 0,
  servers: 0,
  users: 0,
  commands: 0,
  timestamp: 0,
};

export async function GET() {
  try {
    const filePath = join(process.cwd(), "status-data.json");
    const raw = await readFile(filePath, "utf-8");
    const data: StatusData = JSON.parse(raw);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(fallback, { status: 503 });
  }
}
