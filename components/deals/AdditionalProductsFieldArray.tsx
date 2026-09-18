"use client";

import { useState } from "react";
import { ADDITIONAL_PRODUCT_TYPE_LABELS } from "@/lib/types";
import type { AdditionalProduct } from "@prisma/client";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

type Row = { type: string; value: string };

export default function AdditionalProductsFieldArray({
  defaultValues = [],
}: {
  defaultValues?: Pick<AdditionalProduct, "type" | "value">[];
}) {
  const [rows, setRows] = useState<Row[]>(
    defaultValues.length > 0
      ? defaultValues.map((p) => ({ type: p.type, value: String(p.value) }))
      : []
  );

  function addRow() {
    setRows((r) => [...r, { type: "", value: "" }]);
  }

  function removeRow(index: number) {
    setRows((r) => r.filter((_, i) => i !== index));
  }

  function updateRow(index: number, field: keyof Row, value: string) {
    setRows((r) =>
      r.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {rows.map((row, i) => (
        <div key={i} className="flex gap-2 items-center">
          <Select
            name="additionalProductType"
            value={row.type}
            onChange={(e) => updateRow(i, "type", e.target.value)}
            className="flex-1"
          >
            <option value="">Select product…</option>
            {Object.entries(ADDITIONAL_PRODUCT_TYPE_LABELS).map(
              ([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              )
            )}
          </Select>
          <Input
            name="additionalProductValue"
            type="number"
            step="0.01"
            placeholder="Value"
            value={row.value}
            onChange={(e) => updateRow(i, "value", e.target.value)}
            className="w-32"
          />
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={() => removeRow(i)}
            className="text-danger"
          >
            <Trash2 className="h-4 w-4" /> Remove
          </Button>
        </div>
      ))}
      <Button type="button" variant="secondary" size="sm" onClick={addRow} className="self-start">
        <Plus className="h-4 w-4" /> Add product
      </Button>
    </div>
  );
}
