import { TestValidator } from "@nestia/e2e";

import { numericalHairPanelFixture } from "../internal/numericalHairPanelFixture";
import { nclose } from "../internal/predicates";

/**
 * The panel commits a complete gathering block through ordinary face history.
 * Scenarios:
 * 1. A saved guide hierarchy becomes all-integrated as the numeric tie, tail
 *    direction and tube radius are atomically authored in canonical units.
 * 2. An incomplete spread refuses while the draft survives refresh; clearing
 *    both optional fields removes only the tube-volume subblock.
 * 3. Removing gathering and undo/redo preserve the complete documents; a
 *    stale apply control cannot resurrect a removed layer.
 */
export const test_subject_connected_hair_gather = async (): Promise<void> => {
  const f = numericalHairPanelFixture((source) => {
    source.document.hair!.layers[0].guides = {
      fraction: 0.125,
      neighbours: 4,
    };
  });
  try {
    await f.panel.ready;
    const layer = () => f.panel.snapshot()!.document.hair!.layers[0];
    TestValidator.equals("no implicit tie", layer().gather, undefined);
    TestValidator.equals(
      "no saved tie to remove",
      f.element<HTMLButtonElement>("hair-gather-remove").disabled,
      true,
    );
    const values: Record<string, string> = {
      polar: "60",
      azimuth: "-120",
      radius: "15",
      strength: "0.8",
      tailX: "-0.25",
      tailY: "-1",
      tailZ: "0",
      spreadRadius: "40",
      spreadReach: "80",
    };
    for (const [key, value] of Object.entries(values))
      f.element<HTMLInputElement>(`hair-gather-${key}`).value = value;
    const before = structuredClone(f.panel.snapshot()!.document);
    await f.click("hair-gather-apply");
    const saved = structuredClone(f.panel.snapshot()!.document);
    TestValidator.predicate(
      "display degrees and millimetres resolve to one numeric document",
      nclose(layer().gather!.anchor.polar, Math.PI / 3) &&
        nclose(layer().gather!.anchor.azimuth, (-2 * Math.PI) / 3) &&
        nclose(layer().gather!.radius, 0.015) &&
        nclose(layer().gather!.tail.spread!.radius, 0.04) &&
        nclose(layer().gather!.tail.spread!.reach, 0.08),
    );
    TestValidator.predicate(
      "tail and strength",
      nclose(layer().gather!.strength, 0.8) &&
        layer().gather!.tail.direction[0] === -0.25 &&
        layer().gather!.tail.direction[1] === -1 &&
        layer().gather!.tail.direction[2] === 0,
    );
    TestValidator.equals("whole-curve guide coupling", layer().guides, {
      fraction: 1,
      neighbours: 4,
    });
    await f.click("face-undo");
    TestValidator.equals(
      "original document restored",
      f.panel.snapshot()!.document,
      before,
    );
    await f.click("face-redo");
    TestValidator.equals(
      "gathered document restored",
      f.panel.snapshot()!.document,
      saved,
    );
    f.element<HTMLInputElement>("hair-gather-spreadReach").value = "";
    await f.click("hair-gather-apply");
    TestValidator.equals(
      "incomplete block rolls back",
      f.panel.snapshot()!.document,
      saved,
    );
    await f.change("hair-clearance", "0.5");
    TestValidator.equals(
      "draft survives another edit",
      f.element<HTMLInputElement>("hair-gather-spreadReach").value,
      "",
    );
    f.element<HTMLInputElement>("hair-gather-spreadRadius").value = "";
    await f.click("hair-gather-apply");
    TestValidator.equals(
      "empty optional pair removes volume",
      layer().gather!.tail.spread,
      undefined,
    );
    const withoutSpread = structuredClone(f.panel.snapshot()!.document);
    await f.click("hair-gather-remove");
    TestValidator.equals("remove keeps styling", layer().gather, undefined);
    await f.click("face-undo");
    TestValidator.equals(
      "undo restores gathering",
      f.panel.snapshot()!.document,
      withoutSpread,
    );
    await f.click("face-redo");
    TestValidator.equals("redo removes gathering", layer().gather, undefined);
    const stale = f.element<HTMLButtonElement>("hair-gather-apply");
    await f.click("hair-remove");
    const empty = structuredClone(f.panel.snapshot()!.document);
    await stale.onclick!.call(
      stale,
      new f.dom.window.MouseEvent("click") as PointerEvent,
    );
    TestValidator.equals(
      "stale apply cannot recreate a layer",
      f.panel.snapshot()!.document,
      empty,
    );
  } finally {
    f.dom.window.close();
  }
};
