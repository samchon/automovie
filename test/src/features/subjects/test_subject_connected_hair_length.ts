import { TestValidator } from "@nestia/e2e";

import { numericalHairPanelFixture } from "../internal/numericalHairPanelFixture";
import { nclose } from "../internal/predicates";

/**
 * Simple hair length is a reversible display of the fine canonical coordinates.
 * Scenarios:
 * 1. Doubling a 35 mm mean doubles six distinct regional lengths and preserves flow.
 * 2. Reapplying the displayed mean is exact; a fine 90 mm edit changes one region.
 * 3. Undo restores the preceding complete numerical document.
 */
export const test_subject_connected_hair_length = async (): Promise<void> => {
  const f = numericalHairPanelFixture((source) => {
    source.document.hair!.layers[0].lengthAxes = [
      0.01, 0.02, 0.03, 0.04, 0.05, 0.06,
    ];
  });
  try {
    await f.panel.ready;
    const before = structuredClone(f.panel.snapshot()!.document);
    TestValidator.predicate(
      "displayed mean millimetres",
      nclose(Number(f.element<HTMLInputElement>("hair-mean-length").value), 35),
    );
    await f.change("hair-mean-length", "70");
    const scaled = structuredClone(f.panel.snapshot()!.document);
    TestValidator.predicate(
      "fine length ratios preserved",
      scaled.hair!.layers[0].lengthAxes.every((value, at) =>
        nclose(value, before.hair!.layers[0].lengthAxes[at] * 2),
      ),
    );
    TestValidator.equals(
      "combing preserved",
      scaled.hair!.layers[0].flow,
      before.hair!.layers[0].flow,
    );
    await f.change(
      "hair-mean-length",
      f.element<HTMLInputElement>("hair-mean-length").value,
    );
    TestValidator.equals(
      "exact displayed no-op",
      f.panel.snapshot()!.document,
      scaled,
    );
    await f.change("hair-length-4", "90");
    TestValidator.predicate(
      "fine value stored in metres",
      nclose(f.panel.snapshot()!.document.hair!.layers[0].lengthAxes[4], 0.09),
    );
    await f.click("face-undo");
    TestValidator.equals(
      "shared history restores all fine values",
      f.panel.snapshot()!.document,
      scaled,
    );
  } finally {
    f.dom.window.close();
  }
};
