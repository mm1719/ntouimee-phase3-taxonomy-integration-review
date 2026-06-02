import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TaxonomyTree } from "../TaxonomyTree";
import type { TreeNode } from "../../types";

function openNodeNames(container: HTMLElement): string[] {
  return [...container.querySelectorAll("details[open]")].map(
    (details) => details.querySelector(".node-name")?.textContent ?? ""
  );
}

function taxon(name: string, children: TreeNode[]): TreeNode {
  return {
    type: "taxon",
    name,
    rank: "Genus",
    aphia_id: name,
    image_count: 1,
    entry_count: children.length,
    children
  };
}

function terminal(name: string): TreeNode {
  return {
    type: "dataset_class",
    name,
    entry_id: `flowcam_net::${name}`,
    placement_id: `flowcam_net::${name}::1`,
    dataset_id: "flowcam_net",
    dataset_label: "FlowCAMNet",
    image_count: 1,
    entry_count: 1,
    children: []
  };
}

describe("TaxonomyTree branch expansion", () => {
  it("auto-follows single-child taxon branches and stops at the first branching level", async () => {
    const user = userEvent.setup();
    const tree = taxon("Single root", [
      taxon("Only child", [
        taxon("First split", [
          taxon("Left branch", [terminal("Left terminal")]),
          taxon("Right branch", [terminal("Right terminal")])
        ])
      ])
    ]);

    const { container } = render(
      <TaxonomyTree node={tree} depth={3} onSelect={vi.fn()} />
    );

    expect(openNodeNames(container)).toEqual([]);

    await user.click(screen.getByText("Single root"));

    await waitFor(() => {
      expect(openNodeNames(container)).toEqual([
        "Single root",
        "Only child",
        "First split"
      ]);
    });
    expect(openNodeNames(container)).not.toContain("Left branch");
    expect(openNodeNames(container)).not.toContain("Right branch");
  });

  it("auto-follows a single-child path to terminal placements when no split exists", async () => {
    const user = userEvent.setup();
    const tree = taxon("Terminal root", [
      taxon("Only child", [terminal("Only terminal")])
    ]);

    const { container } = render(
      <TaxonomyTree node={tree} depth={3} onSelect={vi.fn()} />
    );

    await user.click(screen.getByText("Terminal root"));

    await waitFor(() => {
      expect(openNodeNames(container)).toEqual(["Terminal root", "Only child"]);
    });
    expect(screen.getByRole("button", { name: /Only terminal/ })).toBeInTheDocument();
  });

  it("lets users close an auto-followed branch instead of forcing it open again", async () => {
    const user = userEvent.setup();
    const tree = taxon("Closable root", [
      taxon("Auto child", [terminal("Auto terminal")])
    ]);

    const { container } = render(
      <TaxonomyTree node={tree} depth={3} onSelect={vi.fn()} />
    );

    await user.click(screen.getByText("Closable root"));
    await waitFor(() => {
      expect(openNodeNames(container)).toEqual(["Closable root", "Auto child"]);
    });

    await user.click(screen.getByText("Auto child"));

    await waitFor(() => {
      expect(openNodeNames(container)).toEqual(["Closable root"]);
    });
  });
});
