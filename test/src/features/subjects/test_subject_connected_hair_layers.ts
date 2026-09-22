import { TestValidator } from "@nestia/e2e";

import { numericalHairPanelFixture } from "../internal/numericalHairPanelFixture";

/**
 * Layer identity and domain selection are ordinary numerical document edits.
 * Scenarios:
 * 1. Selection is view state; rename and domain rebinding affect the selected layer.
 * 2. Removal preserves the other layer, and shared undo restores the removed one.
 */
export const test_subject_connected_hair_layers = async (): Promise<void> => {
  const f = numericalHairPanelFixture((source) => {
    const layer = source.document.hair!.layers[0];
    source.document.hair!.layers = [1, 2].map((ordinal) => ({
      ...structuredClone(layer),
      id: `Layer ${ordinal}`,
    }));
  });
  try {
    await f.panel.ready;
    const before = structuredClone(f.panel.snapshot()!.document);
    TestValidator.equals(
      "distinct owned identities",
      before.hair!.layers.map((layer) => layer.id),
      ["Layer 1", "Layer 2"],
    );
    await f.change("hair-layer", "Layer 2");
    TestValidator.equals(
      "selection does not author",
      f.panel.snapshot()!.document,
      before,
    );
    await f.change("hair-layer-domain", "1");
    await f.change("hair-name", "Side layer");
    const rebound = structuredClone(f.panel.snapshot()!.document);
    TestValidator.equals(
      "chosen anatomical domain",
      rebound.hair!.layers[1].domain,
      "secondary",
    );
    TestValidator.equals(
      "other layer preserved",
      rebound.hair!.layers[0],
      before.hair!.layers[0],
    );
    await f.change("hair-layer", "Side layer");
    await f.click("hair-remove");
    TestValidator.equals(
      "remove one layer",
      f.panel.snapshot()!.document.hair!.layers,
      [before.hair!.layers[0]],
    );
    await f.click("face-undo");
    TestValidator.equals(
      "undo restores layer document",
      f.panel.snapshot()!.document,
      rebound,
    );
  } finally {
    f.dom.window.close();
  }
};
