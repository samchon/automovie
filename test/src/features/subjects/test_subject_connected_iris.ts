import { parseHumanFaceBasisDocument } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import {
  connectedPanelFixture,
  connectedPanelModel,
} from "../internal/connectedPanelFixture";

/**
 * The editor's iris section writes the document's per-eye pigments through
 * the shared transaction and history.
 * Scenarios:
 * 1. A document without iris shows no channel inputs and only the add
 *    button; adding writes the shared portrait palette to both eyes.
 * 2. With "both eyes" on, a channel edit changes both eyes; with it off,
 *    only the selected eye changes, and switching the eye shows that eye's
 *    values.
 * 3. A blank or non-finite value and a band outside the unit range refuse
 *    without changing the committed document; undo restores the previous
 *    pigment and removing drops the field.
 * 4. On the analytic basis without articulated eyes the real builder refuses
 *    the added pigment, so the document keeps no iris.
 */
export const test_subject_connected_iris = async (): Promise<void> => {
  const f = connectedPanelFixture({
    // Stands in for a builder on a basis with eyes: it admits the document
    // (which refuses an out-of-range pigment) and skips the geometry.
    build: async (document) => {
      parseHumanFaceBasisDocument(JSON.stringify(document));
      return connectedPanelModel(document);
    },
  });
  try {
    await f.panel.ready;
    const document = () => f.panel.snapshot()!.document;
    TestValidator.equals(
      "no inputs without iris",
      f.app.querySelectorAll("#face-iris input[type=number]").length,
      0,
    );
    TestValidator.equals(
      "remove disabled",
      f.element<HTMLButtonElement>("iris-remove").disabled,
      true,
    );
    await f.click("iris-add");
    const palette = {
      base: [0.009, 0.006, 0.004],
      variation: [0.05, 0.031, 0.012],
    };
    TestValidator.equals("shared palette on both eyes", document().iris, {
      left: palette,
      right: palette,
    });
    TestValidator.equals(
      "add disabled",
      f.element<HTMLButtonElement>("iris-add").disabled,
      true,
    );

    await f.change("iris-base-b", "0.06");
    TestValidator.equals(
      "both eyes edited",
      [document().iris!.left.base[2], document().iris!.right.base[2]],
      [0.06, 0.06],
    );
    const both = structuredClone(document());
    f.element<HTMLInputElement>("iris-both").checked = false;
    await f.change("iris-eye", "right");
    await f.change("iris-variation-g", "0.2");
    TestValidator.equals(
      "right eye only",
      [document().iris!.left.variation[1], document().iris!.right.variation[1]],
      [0.031, 0.2],
    );
    await f.change("iris-eye", "left");
    TestValidator.equals(
      "left values shown",
      f.element<HTMLInputElement>("iris-variation-g").value,
      "0.031",
    );

    const committed = structuredClone(document());
    for (const value of ["", "Infinity", "0.99"]) {
      await f.change("iris-base-r", value);
      TestValidator.equals(
        "refused value keeps the document",
        document(),
        committed,
      );
    }
    await f.click("face-undo");
    TestValidator.equals("undo", document(), both);
    await f.click("iris-remove");
    TestValidator.equals("removed", document().iris, undefined);
  } finally {
    f.dom.window.close();
  }

  const real = connectedPanelFixture();
  try {
    await real.panel.ready;
    await real.click("iris-add");
    TestValidator.equals(
      "builder refusal keeps no iris",
      real.panel.snapshot()!.document.iris,
      undefined,
    );
  } finally {
    real.dom.window.close();
  }
};
