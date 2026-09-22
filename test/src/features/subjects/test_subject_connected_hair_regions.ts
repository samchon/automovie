import { TestValidator } from "@nestia/e2e";

import { numericalHairPanelFixture } from "../internal/numericalHairPanelFixture";
import { nclose } from "../internal/predicates";

/**
 * Local growth is numerical editor state with metric units and ordinary history.
 * Scenarios:
 * 1. Enabling a root region exposes all six coefficients, and edits convert
 *    displayed millimetres to metres without changing the parting envelope.
 * 2. Invalid spreads refuse and restore the last committed values.
 * 3. Disabling a region removes its fields and refuses a captured stale edit.
 */
export const test_subject_connected_hair_regions = async (): Promise<void> => {
  const f = numericalHairPanelFixture();
  try {
    await f.panel.ready;
    await f.check("hair-part", true);
    await f.check("hair-part-region", true);
    const part = structuredClone(
      f.panel.snapshot()!.document.hair!.layers[0].part,
    );
    await f.check("hair-root-region", true);
    for (const key of ["center", "spread"] as const)
      for (let axis = 0; axis < 3; axis++) {
        const mm = (key === "center" ? -1 : 1) * (axis + 1) * 20;
        await f.change(`hair-root-region-${key}-${axis}`, String(mm));
        TestValidator.predicate(
          "metric coefficient",
          nclose(
            f.panel.snapshot()!.document.hair!.layers[0].rootRegion![key][axis],
            mm / 1000,
          ),
        );
      }
    TestValidator.equals(
      "parting is independent",
      f.panel.snapshot()!.document.hair!.layers[0].part,
      part,
    );
    const valid = structuredClone(f.panel.snapshot()!.document);
    await f.change("hair-root-region-spread-0", "0");
    TestValidator.equals(
      "invalid spread rolls back",
      f.panel.snapshot()!.document,
      valid,
    );
    const stale = f.element<HTMLInputElement>("hair-root-region-center-0");
    stale.value = "42";
    await f.check("hair-root-region", false);
    const removed = structuredClone(f.panel.snapshot()!.document);
    await stale.onchange!.call(stale, new f.dom.window.Event("change"));
    TestValidator.equals(
      "stale edit refuses",
      f.panel.snapshot()!.document,
      removed,
    );
  } finally {
    f.dom.window.close();
  }
};
