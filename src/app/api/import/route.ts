import { NextRequest, NextResponse } from "next/server";
import { bulkUpsert } from "@/lib/storage";
import { parseExcelBuffer } from "@/lib/excel";
import type { ApiResponse, ImportResult } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const mode = (form.get("mode") as string) === "replace" ? "replace" : "merge";

    if (!file) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: "No file provided." },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    const parseResult = parseExcelBuffer(buffer);
    const items = parseResult.items;

    if (items.length === 0) {
      return NextResponse.json<ApiResponse<ImportResult>>(
        {
          success: false,
          error: parseResult.errors[0] ?? "No data to import.",
          data: parseResult,
        },
        { status: 400 }
      );
    }

    const { imported, updated, skipped } = await bulkUpsert(items, mode);

    const result: ImportResult = {
      imported,
      updated,
      skipped,
      errors: parseResult.errors,
    };

    return NextResponse.json<ApiResponse<ImportResult>>({
      success: true,
      data: result,
      meta: { imported, updated, skipped },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
