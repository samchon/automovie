import { TestValidator } from "@nestia/e2e";

import { connectedPanelFixture } from "../internal/connectedPanelFixture";
import { pigmentationPanelSource } from "../internal/pigmentationPanelSource";

/**
 * Regional field admission preserves the last committed document.
 * Scenarios:
 * 1. Blank or duplicate names, invalid dimensions and unbounded colour refuse.
 * 2. Each refusal preserves both regions and a following valid edit recovers.
 */
export const test_subject_connected_pigmentation_refusals =
  async (): Promise<void> => {
    const f = connectedPanelFixture({ source: pigmentationPanelSource() });
    await f.panel.ready;
    const first = f.basis.surfaces[0].id;
    const authored = structuredClone(f.panel.snapshot()!.document);
    await f.change("pigment-region", "cheek");
    for (const [id, value] of [
      ["pigment-name", ""],
      ["pigment-name", "Region 1"],
      ["pigment-center-0", ""],
      ["pigment-center-0", "Infinity"],
      ["pigment-radius-1", "0"],
      ["pigment-radius-1", "-1"],
      ["pigment-gain-0", "1.1"],
      ["pigment-strength-0", "-0.1"],
    ]) {
      await f.change(id, value);
      TestValidator.equals(
        "invalid preserves state",
        f.panel.snapshot()!.document,
        authored,
      );
    }
    await f.change("pigment-strength-0", ".5");
    TestValidator.equals(
      "valid recovery",
      f.panel.snapshot()!.document.skin![first][1].strength,
      0.5,
    );
    f.dom.window.close();
  };
