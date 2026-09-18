import type { Deal } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export default function VehicleFields({
  defaultValues,
}: {
  defaultValues?: Partial<Deal>;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <label htmlFor="carsInterested">Car(s) interested</label>
        <textarea
          id="carsInterested"
          name="carsInterested"
          rows={2}
          defaultValue={defaultValues?.carsInterested ?? ""}
          placeholder="e.g. looking for a used estate, diesel, under £15k"
          className="form-control form-control-textarea"
        />
      </div>

      <fieldset className="border border-hairline rounded-md p-4 flex flex-col gap-3">
        <legend className="px-1">Final car (set at Proposal Submitted)</legend>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="finalMake">Make</label>
            <Input
              id="finalMake"
              name="finalMake"
              defaultValue={defaultValues?.finalMake ?? ""}
            />
          </div>
          <div>
            <label htmlFor="finalModel">Model</label>
            <Input
              id="finalModel"
              name="finalModel"
              defaultValue={defaultValues?.finalModel ?? ""}
            />
          </div>
          <div>
            <label htmlFor="finalYear">Year</label>
            <Input
              id="finalYear"
              name="finalYear"
              type="number"
              defaultValue={defaultValues?.finalYear ?? ""}
            />
          </div>
          <div>
            <label htmlFor="finalRegistration">Registration</label>
            <Input
              id="finalRegistration"
              name="finalRegistration"
              defaultValue={defaultValues?.finalRegistration ?? ""}
            />
          </div>
          <div>
            <label htmlFor="finalMileage">Mileage</label>
            <Input
              id="finalMileage"
              name="finalMileage"
              type="number"
              defaultValue={defaultValues?.finalMileage ?? ""}
            />
          </div>
          <div>
            <label htmlFor="finalPrice">Price (£, asking price)</label>
            <Input
              id="finalPrice"
              name="finalPrice"
              type="number"
              step="0.01"
              defaultValue={
                defaultValues?.finalPrice
                  ? String(defaultValues.finalPrice)
                  : ""
              }
            />
          </div>
          <div>
            <label htmlFor="deposit">Deposit (£)</label>
            <Input
              id="deposit"
              name="deposit"
              type="number"
              step="0.01"
              defaultValue={
                defaultValues?.deposit ? String(defaultValues.deposit) : ""
              }
            />
          </div>
          <div>
            <label htmlFor="finalIsNew">New/used</label>
            <Select
              id="finalIsNew"
              name="finalIsNew"
              defaultValue={
                defaultValues?.finalIsNew === undefined ||
                defaultValues?.finalIsNew === null
                  ? ""
                  : String(defaultValues.finalIsNew)
              }
            >
              <option value="">—</option>
              <option value="true">New</option>
              <option value="false">Used</option>
            </Select>
          </div>
        </div>
      </fieldset>
    </div>
  );
}
