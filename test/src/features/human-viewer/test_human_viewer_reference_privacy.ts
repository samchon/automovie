import { TestValidator } from "@nestia/e2e";

import { planHumanViewerReference } from "../../../scripts/human-viewer/planHumanViewerReference";

/**
 * A local photograph is optional and cannot leak through the public display plan.
 * Scenarios:
 * 1. Missing or unrequested references disable quietly.
 * 2. All three presentation modes carry only their finite display contribution.
 * 3. Invalid opacity refuses even for an absent reference.
 */
export function test_human_viewer_reference_privacy(): void {
  TestValidator.equals(
    "absent",
    planHumanViewerReference(false, "split", 0.5),
    { enabled: false, mode: null, renderOpacity: 1 },
  );
  TestValidator.equals(
    "unrequested",
    planHumanViewerReference(true, null, 0.5),
    { enabled: false, mode: null, renderOpacity: 1 },
  );
  for (const mode of ["split", "swipe", "overlay"] as const) {
    const plan = planHumanViewerReference(true, mode, 0.25);
    TestValidator.equals("display fields", Object.keys(plan), [
      "enabled",
      "mode",
      "renderOpacity",
    ]);
    TestValidator.equals(
      "contribution",
      plan.renderOpacity,
      mode === "overlay" ? 0.25 : 1,
    );
  }
  for (const opacity of [-0.01, 1.01, Infinity, NaN]) {
    let refused = false;
    try {
      planHumanViewerReference(false, null, opacity);
    } catch {
      refused = true;
    }
    TestValidator.predicate("invalid opacity", refused);
  }
  TestValidator.equals(
    "zero",
    planHumanViewerReference(true, "overlay", 0).renderOpacity,
    0,
  );
  TestValidator.equals(
    "one",
    planHumanViewerReference(true, "overlay", 1).renderOpacity,
    1,
  );
}
