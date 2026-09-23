import { TestValidator } from "@nestia/e2e";

import { numericalHairPanelFixture } from "../internal/numericalHairPanelFixture";

/**
 * Generic hair creation writes explicit fine parameters on a shared domain.
 * Scenarios:
 * 1. An omitted hair document initially has no editable layer.
 * 2. Two additions receive distinct identities and the selected resident domain.
 * 3. A layer rename collision refuses without replacing the existing population.
 */
export const test_subject_connected_hair_creation = async (): Promise<void> => {
  const f = numericalHairPanelFixture((source) => {
    delete source.document.hair;
  });
  try {
    await f.panel.ready;
    TestValidator.equals(
      "bald has no layer controls",
      f.app.querySelector("#hair-name"),
      null,
    );
    f.element<HTMLSelectElement>("hair-domain").value = "1";
    await f.click("hair-add");
    await f.click("hair-add");
    const before = structuredClone(f.panel.snapshot()!.document);
    TestValidator.equals(
      "distinct identities",
      before.hair!.layers.map((layer) => layer.id),
      ["Layer 1", "Layer 2"],
    );
    TestValidator.equals(
      "selected common domain",
      before.hair!.layers.map((layer) => layer.domain),
      ["secondary", "secondary"],
    );
    await f.change("hair-name", "Layer 2");
    TestValidator.equals(
      "duplicate name refuses",
      f.panel.snapshot()!.document,
      before,
    );
  } finally {
    f.dom.window.close();
  }
};
