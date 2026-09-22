import { TestValidator } from "@nestia/e2e";

import { numericalHairPanelFixture } from "../internal/numericalHairPanelFixture";

/**
 * Invalid and obsolete hair controls cannot replace committed numerical state.
 * Scenarios:
 * 1. Empty/nonpositive mean, empty fine input and invalid enums/domains refuse.
 * 2. A removed layer's retained DOM handler cannot edit the remaining document.
 * 3. Valid recovery commits through the same transaction after every refusal.
 */
export const test_subject_connected_hair_refusals = async (): Promise<void> => {
  const f = numericalHairPanelFixture();
  try {
    await f.panel.ready;
    const before = structuredClone(f.panel.snapshot()!.document);
    for (const [id, value] of [
      ["hair-mean-length", ""],
      ["hair-mean-length", "0"],
      ["hair-width", ""],
      ["hair-width", "-1"],
      ["hair-curl-mode", "unsupported"],
      ["hair-layer-domain", "missing"],
    ]) {
      await f.change(id, value);
      TestValidator.equals(
        "invalid control preserves document",
        f.panel.snapshot()!.document,
        before,
      );
    }
    const stale = f.element<HTMLInputElement>("hair-width");
    stale.value = "2";
    await f.click("hair-remove");
    const empty = structuredClone(f.panel.snapshot()!.document);
    await stale.onchange!.call(stale, new f.dom.window.Event("change"));
    TestValidator.equals(
      "stale layer cannot reappear",
      f.panel.snapshot()!.document,
      empty,
    );
    await f.click("face-undo");
    await f.change("hair-count", "1");
    TestValidator.equals(
      "valid recovery",
      f.panel.snapshot()!.document.hair!.layers[0].count,
      1,
    );
  } finally {
    f.dom.window.close();
  }
};
