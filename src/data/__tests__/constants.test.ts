import { describe, expect, it } from "vitest";
import {
  DATASET_LABELS,
  ECOTAXA_DATASET_COLOR,
  datasetColor,
  datasetLabel,
  datasetSort
} from "../constants";

describe("dataset display helpers", () => {
  it("resolves supplied, built-in, EcoTaxa, and unknown labels and colors", () => {
    expect(datasetLabel("life_watch", { life_watch: "Custom LifeWatch" })).toBe("Custom LifeWatch");
    expect(datasetLabel("life_watch")).toBe(DATASET_LABELS.life_watch);
    expect(datasetLabel("ecotaxa_4424")).toBe("EcoTaxa 4424");
    expect(datasetLabel("new_dataset")).toBe("new_dataset");

    expect(datasetColor("life_watch")).toBe("#2563eb");
    expect(datasetColor("ecotaxa_4424")).toBe(ECOTAXA_DATASET_COLOR);
    expect(datasetColor("new_dataset")).toBe("#6b7280");
  });

  it("sorts built-in datasets first, EcoTaxa numerically, then unknown names", () => {
    const values = [
      "zeta",
      "ecotaxa_20",
      "life_watch",
      "alpha",
      "ecotaxa_3",
      "flowcam_net"
    ];

    expect(values.sort(datasetSort)).toEqual([
      "life_watch",
      "flowcam_net",
      "ecotaxa_3",
      "ecotaxa_20",
      "alpha",
      "zeta"
    ]);
  });
});
