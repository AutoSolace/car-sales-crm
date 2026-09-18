import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { parseCsv } from "@/lib/import/parseCsv";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const text = await file.text();
  const { headers, rows } = parseCsv(text);

  if (headers.length === 0) {
    return NextResponse.json(
      { error: "CSV appears to be empty" },
      { status: 400 }
    );
  }

  const session = await prisma.importSession.create({
    data: {
      filename: file.name,
      headers: JSON.stringify(headers),
      rawDataJson: JSON.stringify(rows),
    },
  });

  return NextResponse.json({
    sessionId: session.id,
    headers,
    rowCount: rows.length,
    preview: rows.slice(0, 5),
  });
}
