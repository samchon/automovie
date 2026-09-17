import { TestValidator } from "@nestia/e2e";

import { createHumanPanelFixture } from "../internal/createHumanPanelFixture";

/** A different subject publishes once and an unknown selection preserves the current model.
 * The DOM and preview remain in memory; each scenario owns its own fixture.
 */
export const test_subject_human_panel_selection = async (): Promise<void> => {
  const f = createHumanPanelFixture();
  await f.panel.ready;
  await f.change("face-subject", "second");
  TestValidator.equals(
    "selected subject",
    f.panel.snapshot()!.document.id,
    "second",
  );
  TestValidator.equals("both models published", f.published, [
    "first",
    "second",
  ]);
  await f.change("face-subject", "missing");
  TestValidator.equals("unknown selection unchanged", f.published.length, 2);
  TestValidator.equals("one cancel per read", f.cancellations(), 2);
  f.dom.window.close();
};
