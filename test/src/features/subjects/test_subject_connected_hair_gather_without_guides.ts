import { TestValidator } from "@nestia/e2e";

import { numericalHairPanelFixture } from "../internal/numericalHairPanelFixture";

/**
 * A complete tie may be authored without first creating a guide hierarchy.
 * Scenarios:
 * 1. Empty and nonfinite form inputs and a zero tail direction refuse while
 *    the current document and the entered draft remain available for repair.
 * 2. A recovered complete tie without spread commits with no implicit guides;
 *    removal restores the ordinary numerical layer.
 */
export const test_subject_connected_hair_gather_without_guides =
  async (): Promise<void> => {
    const f = numericalHairPanelFixture();
    try {
      await f.panel.ready;
      const before = structuredClone(f.panel.snapshot()!.document);
      await f.click("hair-gather-apply");
      TestValidator.equals(
        "blank tie refuses",
        f.panel.snapshot()!.document,
        before,
      );
      const values: Record<string, string> = {
        polar: "60",
        azimuth: "-120",
        radius: "15",
        strength: "1",
        tailX: "0",
        tailY: "0",
        tailZ: "0",
      };
      for (const [key, value] of Object.entries(values))
        f.element<HTMLInputElement>(`hair-gather-${key}`).value = value;
      await f.click("hair-gather-apply");
      TestValidator.equals(
        "zero tail refuses",
        f.panel.snapshot()!.document,
        before,
      );
      TestValidator.equals(
        "rejected build keeps its complete draft",
        f.element<HTMLInputElement>("hair-gather-polar").value,
        "60",
      );
      const currentTail = () =>
        f.element<HTMLInputElement>("hair-gather-tailY");
      currentTail().type = "text";
      currentTail().value = "Infinity";
      await f.click("hair-gather-apply");
      TestValidator.equals(
        "nonfinite tail refuses",
        f.panel.snapshot()!.document,
        before,
      );
      currentTail().value = "-1";
      await f.click("hair-gather-apply");
      const layer = f.panel.snapshot()!.document.hair!.layers[0];
      TestValidator.predicate(
        "valid no-guide tie without volume",
        layer.guides === undefined &&
          layer.gather !== undefined &&
          layer.gather.tail.spread === undefined,
      );
      await f.click("hair-gather-remove");
      TestValidator.equals(
        "removal restores the ordinary layer",
        f.panel.snapshot()!.document,
        before,
      );
    } finally {
      f.dom.window.close();
    }
  };
