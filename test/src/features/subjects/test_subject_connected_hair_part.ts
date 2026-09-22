import { TestValidator } from "@nestia/e2e";

import { numericalHairPanelFixture } from "../internal/numericalHairPanelFixture";
import { nclose } from "../internal/predicates";

/**
 * Parting and its optional region remain complete typed numeric structures.
 * Scenarios:
 * 1. Adding a part exposes plane/decay controls and stores millimetres as metres.
 * 2. Regional influence is independently added and removed; a stale region input refuses.
 * 3. Removing the part rejects its stale toggle and preserves unrelated curl mode.
 */
export const test_subject_connected_hair_part = async (): Promise<void> => {
  const f = numericalHairPanelFixture();
  try {
    await f.panel.ready;
    await f.check("hair-part", true);
    await f.change("hair-part-offset", "5");
    TestValidator.predicate(
      "metric plane offset",
      nclose(f.panel.snapshot()!.document.hair!.layers[0].part!.offset, 0.005),
    );
    await f.check("hair-part-region", true);
    const stale = f.element<HTMLInputElement>("hair-part-region-center-0");
    stale.value = "10";
    await f.check("hair-part-region", false);
    const unlocalized = structuredClone(f.panel.snapshot()!.document);
    await stale.onchange!.call(stale, new f.dom.window.Event("change"));
    TestValidator.equals(
      "stale regional field refuses",
      f.panel.snapshot()!.document,
      unlocalized,
    );
    const toggle = f.element<HTMLInputElement>("hair-part-region");
    toggle.checked = true;
    await f.check("hair-part", false);
    const noPart = structuredClone(f.panel.snapshot()!.document);
    await toggle.onchange!.call(toggle, new f.dom.window.Event("change"));
    TestValidator.equals(
      "stale region toggle refuses",
      f.panel.snapshot()!.document,
      noPart,
    );
    await f.change("hair-curl-mode", "helix");
    TestValidator.equals(
      "closed curl enum",
      f.panel.snapshot()!.document.hair!.layers[0].curl.mode,
      "helix",
    );
  } finally {
    f.dom.window.close();
  }
};
