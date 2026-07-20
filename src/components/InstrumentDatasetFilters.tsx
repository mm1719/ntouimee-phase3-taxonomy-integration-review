import type { DatasetId } from "../types";
import { datasetLabel } from "../data/constants";

type Props = {
  options: DatasetId[];
  selected: Set<DatasetId>;
  instruments?: Record<DatasetId, string>;
  labels?: Record<DatasetId, string>;
  onToggle: (dataset: DatasetId) => void;
  onToggleMany: (datasets: DatasetId[], enabled: boolean) => void;
};

export function InstrumentDatasetFilters({
  options,
  selected,
  instruments = {},
  labels = {},
  onToggle,
  onToggleMany
}: Props) {
  const groups = new Map<string, DatasetId[]>();
  options.forEach((dataset) => {
    const instrument = instruments[dataset] || "Unspecified";
    groups.set(instrument, [...(groups.get(instrument) ?? []), dataset]);
  });

  return (
    <div className="instrument-groups">
      {[...groups].map(([instrument, datasets]) => {
        const selectedCount = datasets.filter((dataset) => selected.has(dataset)).length;
        const allSelected = selectedCount === datasets.length;
        return (
          <div className="instrument-group" key={instrument}>
            <label className="check-row instrument-parent">
              <input
                type="checkbox"
                aria-label={`${instrument} datasets`}
                checked={allSelected}
                ref={(input) => {
                  if (input) input.indeterminate = selectedCount > 0 && !allSelected;
                }}
                onChange={(event) => onToggleMany(datasets, event.target.checked)}
              />
              <strong>{instrument}</strong>
            </label>
            <div className="instrument-children">
              {datasets.map((dataset) => (
                <label className="check-row" key={dataset}>
                  <input
                    type="checkbox"
                    checked={selected.has(dataset)}
                    onChange={() => onToggle(dataset)}
                  />
                  {datasetLabel(dataset, labels)}
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
