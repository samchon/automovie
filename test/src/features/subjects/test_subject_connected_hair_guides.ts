import { TestValidator } from "@nestia/e2e";

import { numericalHairPanelFixture } from "../internal/numericalHairPanelFixture";

/**
 * The panel turns the guide hierarchy on and off and edits it as numbers.
 * Scenarios:
 * 1. The toggle adds the production ratio, an eighth of the roots as guides
 *    with four guides per strand, and exposes both as fields.
 * 2. Editing the fraction and the neighbour count writes the document.
 * 3. A fraction the admission refuses rolls the edit back, and turning the
 *    hierarchy off removes it and its fields.
 */
export const test_subject_connected_hair_guides = async (): Promise<void> => {
  const f = numericalHairPanelFixture();
  try {
    await f.panel.ready;
    const layer = () => f.panel.snapshot()!.document.hair!.layers[0];
    TestValidator.equals("flat by default", layer().guides, undefined);
    await f.check("hair-guides", true);
    TestValidator.equals("production ratio", layer().guides, {
      fraction: 0.125,
      neighbours: 4,
    });
    await f.change("hair-guides-fraction", "0.25");
    await f.change("hair-guides-neighbours", "6");
    TestValidator.equals("edited hierarchy", layer().guides, {
      fraction: 0.25,
      neighbours: 6,
    });
    const valid = structuredClone(f.panel.snapshot()!.document);
    await f.change("hair-guides-fraction", "0");
    TestValidator.equals(
      "refused fraction rolls back",
      f.panel.snapshot()!.document,
      valid,
    );
    await f.check("hair-guides", false);
    TestValidator.predicate(
      "turned off",
      layer().guides === undefined &&
        f.app.querySelector("#hair-guides-fraction") === null,
    );
  } finally {
    f.dom.window.close();
  }
};
