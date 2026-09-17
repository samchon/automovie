import { TestValidator } from "@nestia/e2e";

import { connectedPanelFixture } from "../internal/connectedPanelFixture";
import { humanFaceBasisFixture } from "../internal/humanFaceBasisFixture";

/**
 * Application-selected studies use the same admission and history as edits.
 *
 * Scenarios:
 * 1. An empty selection retains the current face without a build.
 * 2. Selection commits an owned document and undo restores the previous face.
 * 3. A wrong-basis study is refused without publishing or losing prior edits.
 */
export const test_subject_connected_panel_studies = async (): Promise<void> => {
  const source = humanFaceBasisFixture();
  const selected = {
    ...source.document,
    name: "Selected",
    shape: { width: 0.4 },
  };
  const f = connectedPanelFixture({
    studies: [selected, { ...selected, basis: "wrong-basis" }],
  });
  await f.panel.ready;
  await f.change("face-study", "");
  TestValidator.equals("empty is inert", f.published.length, 1);
  await f.change("face-study", "0");
  TestValidator.equals(
    "selected document",
    f.panel.snapshot()!.document,
    selected,
  );
  TestValidator.equals(
    "selection reset",
    f.element<HTMLSelectElement>("face-study").value,
    "",
  );
  await f.change("control-width", "0.2");
  TestValidator.equals("input remains owned", selected.shape.width, 0.4);
  await f.click("face-undo");
  TestValidator.equals("undo edit", f.panel.snapshot()!.document, selected);
  await f.change("face-study", "1");
  TestValidator.equals(
    "invalid preserves previous",
    f.panel.snapshot()!.document,
    selected,
  );
  TestValidator.equals("refusal visible", f.panel.snapshot()!.status, "error");
  await f.click("face-undo");
  TestValidator.equals(
    "undo selection",
    f.panel.snapshot()!.document,
    source.document,
  );
  f.dom.window.close();
};
