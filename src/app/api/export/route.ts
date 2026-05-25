import { NextRequest, NextResponse } from "next/server";
import { readInventory } from "@/lib/storage";
import { createTemplateBuffer, exportToExcelBuffer } from "@/lib/excel";
import type { Region } from "@/lib/types";
import { resolveRegion } from "@/lib/regions";

export async function GET(req: NextRequest) {
  const isTemplate = req.nextUrl.searchParams.get("template") === "1";

  if (isTemplate) {
    const buffer = createTemplateBuffer();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          'attachment; filename="bibus-inventory-template.xlsx"',
      },
    });
  }

  const region = req.nextUrl.searchParams.get("region") as Region | null;
  let items = await readInventory();
  if (region) {
    items = items.filter((i) => resolveRegion(i) === region);
  }
  const buffer = exportToExcelBuffer(items);
  const date = new Date().toISOString().slice(0, 10);
  const suffix = region ? `-${region.toLowerCase()}` : "";

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="bibus-inventory${suffix}-${date}.xlsx"`,
    },
  });
}
