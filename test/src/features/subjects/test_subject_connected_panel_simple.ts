import { parseHumanFaceBasisDocument } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { connectedPanelFixture } from "../internal/connectedPanelFixture";
import { humanFaceBasisFixture } from "../internal/humanFaceBasisFixture";
import { nclose } from "../internal/predicates";

/**
 * Simple input reaches the existing numerical editor as fine coordinates only.
 *
 * Scenarios:
 * 1. A paired edit preserves asymmetric detail and owns ordinary undo/redo.
 * 2. Switching mode and searching are display-only; fine edits survive returning.
 * 3. Out-of-domain and empty simple edits refuse, then a valid edit recovers.
 * 4. Saving and reloading carry only canonical detail, including hidden channels.
 */
export const test_subject_connected_panel_simple = async (): Promise<void> => {
  const source = humanFaceBasisFixture();
  source.basis.channels.push({ ...source.basis.channels[0], id: "right" });
  source.document.shape = { width: -0.25, right: 0.5 };
  const f = connectedPanelFixture({
    source,
    controlMap: {
      basis: source.basis.id,
      groups: [
        {
          id: "size",
          label: "Feature size",
          description: "Preserve left and right differences.",
          channels: ["width", "right"],
        },
      ],
    },
  });
  await f.panel.ready;
  TestValidator.equals(
    "simple is initial presentation",
    f.element<HTMLSelectElement>("control-level").value,
    "simple",
  );
  TestValidator.equals(
    "shape/performance group hidden",
    f.element("control-kind").hidden,
    true,
  );
  TestValidator.equals(
    "mean is visible without slider rounding",
    f.element<HTMLInputElement>("simple-size").value,
    "0.125",
  );
  TestValidator.equals(
    "residual narrows range",
    f.element<HTMLInputElement>("simple-size").max,
    "0.625",
  );
  await f.change("simple-size", "0.25");
  TestValidator.predicate(
    "lowered left",
    nclose(f.panel.snapshot()!.document.shape.width, -0.125),
  );
  TestValidator.predicate(
    "lowered right",
    nclose(f.panel.snapshot()!.document.shape.right, 0.625),
  );
  await f.click("face-undo");
  TestValidator.equals(
    "undo restores detail",
    f.panel.snapshot()!.document,
    source.document,
  );
  await f.click("face-redo");
  const committed = f.panel.snapshot()!.document;
  await f.change("control-level", "fine");
  TestValidator.equals(
    "mode does not author",
    f.panel.snapshot()!.document,
    committed,
  );
  TestValidator.equals(
    "fine controls reveal exact values",
    f.element<HTMLInputElement>("control-right").value,
    "0.625",
  );
  await f.change("control-width", "0");
  await f.change("control-level", "simple");
  TestValidator.equals(
    "fine edit contributes to simple mean",
    f.element<HTMLInputElement>("simple-size").value,
    "0.3125",
  );
  const beforeRefusal = f.panel.snapshot()!.document;
  await f.change("simple-size", "1");
  TestValidator.equals(
    "outside input refuses",
    f.element("face-status").dataset.state,
    "error",
  );
  TestValidator.equals(
    "outside input preserves canonical state",
    f.panel.snapshot()!.document,
    beforeRefusal,
  );
  await f.change("simple-size", "");
  TestValidator.equals(
    "empty refuses",
    f.element("face-status").textContent,
    "A numeric value is required.",
  );
  await f.change("simple-size-slider", "0.5");
  TestValidator.predicate(
    "valid input recovers left",
    nclose(f.panel.snapshot()!.document.shape.width, 0.1875),
  );
  TestValidator.predicate(
    "valid input recovers right",
    nclose(f.panel.snapshot()!.document.shape.right, 0.8125),
  );
  const search = f.element<HTMLInputElement>("control-search");
  search.value = "FEATURE SIZE";
  search.oninput!.call(search, new f.dom.window.InputEvent("input"));
  TestValidator.equals(
    "simple search includes label",
    f.app.querySelectorAll(".row").length,
    1,
  );
  await f.click("face-save");
  const saved = parseHumanFaceBasisDocument(String(f.downloads[0].bytes));
  TestValidator.equals(
    "saved canonical document",
    saved,
    f.panel.snapshot()!.document,
  );
  await f.click("face-reset");
  await f.file(async () => JSON.stringify(saved));
  TestValidator.equals(
    "reload restores canonical document",
    f.panel.snapshot()!.document,
    saved,
  );
  TestValidator.equals(
    "reload projects simple value",
    f.element<HTMLInputElement>("simple-size").value,
    "0.5",
  );
  f.dom.window.close();
};
