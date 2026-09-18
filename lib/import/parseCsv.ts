import Papa from "papaparse";

export interface ParsedCsv {
  headers: string[];
  rows: string[][];
}

export function parseCsv(csvText: string): ParsedCsv {
  const result = Papa.parse<string[]>(csvText.trim(), {
    header: false,
    skipEmptyLines: true,
  });

  const [headers, ...rows] = result.data;
  return { headers: headers ?? [], rows };
}
