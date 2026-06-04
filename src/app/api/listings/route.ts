import { NextResponse } from "next/server";
import { fetchSheetData } from "@/lib/sheet-data";

export async function GET() {
  try {
    const data = await fetchSheetData();
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    const status = message.includes("Missing required") ? 500 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
