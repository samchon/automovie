import { TestValidator } from "@nestia/e2e";

import { numericalHairPanelFixture } from "../internal/numericalHairPanelFixture";

/**
 * Hair layer admission does not infer an anatomical domain from missing input.
 * Scenarios:
 * 1. An absent shared domain disables creation and a forced event still refuses.
 * 2. Eight admitted layers disable creation and a forced ninth remains refused.
 * 3. An absent selection cannot remove a layer; an invalid creation domain refuses.
 */
export const test_subject_connected_hair_domains = async (): Promise<void> => {
  const f = numericalHairPanelFixture((source) => {
    source.document.hair = null;
    delete source.basis.surfaces[0].hairDomains;
  });
  try {
    await f.panel.ready;
    TestValidator.equals(
      "no shared domain",
      f.element<HTMLButtonElement>("hair-add").disabled,
      true,
    );
    await f.click("hair-add");
    TestValidator.equals(
      "no invented domain",
      f.panel.snapshot()!.document.hair,
      null,
    );
  } finally {
    f.dom.window.close();
  }
  const full = numericalHairPanelFixture((source) => {
    const layer = source.document.hair!.layers[0];
    source.document.hair!.layers = Array.from({ length: 8 }, (_, at) => ({
      ...structuredClone(layer),
      id: `Layer ${at + 1}`,
    }));
  });
  try {
    await full.panel.ready;
    const before = structuredClone(full.panel.snapshot()!.document);
    TestValidator.equals(
      "layer capacity",
      full.element<HTMLButtonElement>("hair-add").disabled,
      true,
    );
    await full.click("hair-add");
    TestValidator.equals(
      "ninth refuses",
      full.panel.snapshot()!.document,
      before,
    );
    full.element<HTMLSelectElement>("hair-layer").value = "missing";
    await full.click("hair-remove");
    TestValidator.equals(
      "absent selection preserves layers",
      full.panel.snapshot()!.document,
      before,
    );
    full.element<HTMLSelectElement>("hair-domain").value = "missing";
    await full.click("hair-add");
    TestValidator.equals(
      "invalid domain preserves layers",
      full.panel.snapshot()!.document,
      before,
    );
  } finally {
    full.dom.window.close();
  }
};
