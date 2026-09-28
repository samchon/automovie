import { TestValidator } from "@nestia/e2e";

import { connectedPanelFixture } from "../internal/connectedPanelFixture";

/**
 * Appearance edits share transactions, preserve unrelated authored settings
 * and expose linear values without an image lookup or implicit sRGB conversion.
 *
 * Scenarios:
 * 1. Inherited RGB/roughness display, then successive channel edits compose.
 * 2. A material switch leaves the document intact; another material stays owned.
 * 3. Invalid inputs preserve committed state; valid recovery and undo work.
 * 4. An unavailable selection has no editable rows and restores cleanly.
 */
export const test_subject_connected_panel_appearance =
  async (): Promise<void> => {
    const f = connectedPanelFixture();
    await f.panel.ready;
    const material = f.basis.materials[0];
    TestValidator.equals(
      "inherited red",
      Number(f.element<HTMLInputElement>("appearance-r").value),
      material.baseColor.r,
    );
    TestValidator.equals(
      "inherited roughness",
      Number(f.element<HTMLInputElement>("appearance-roughness").value),
      material.roughness,
    );
    await f.change("appearance-r", "0");
    await f.change("appearance-g", "1");
    await f.change("appearance-b", "0.25");
    await f.change("appearance-roughness", "0.3");
    const authored = structuredClone(f.panel.snapshot()!.document);
    TestValidator.equals(
      "linear channels compose",
      authored.materials![material.id],
      {
        color: { r: 0, g: 1, b: 0.25 },
        roughness: 0.3,
      },
    );
    await f.change("appearance-material", f.basis.materials[1].id);
    TestValidator.equals(
      "selection does not edit",
      f.panel.snapshot()!.document,
      authored,
    );
    await f.change("appearance-roughness", "1");
    TestValidator.equals(
      "other material retained",
      f.panel.snapshot()!.document.materials![material.id],
      authored.materials![material.id],
    );
    await f.click("face-undo");
    TestValidator.equals(
      "undo numerical edit",
      f.panel.snapshot()!.document,
      authored,
    );
    for (const value of ["", "-0.1", "1.1", "Infinity"]) {
      await f.change("appearance-r", value);
      TestValidator.equals(
        "refused input preserves committed state",
        f.panel.snapshot()!.document,
        authored,
      );
    }
    await f.change("appearance-r", "0.5");
    TestValidator.equals(
      "recovery commits",
      f.panel.snapshot()!.document.materials![f.basis.materials[1].id].color!.r,
      0.5,
    );
    await f.change("appearance-material", "absent");
    TestValidator.equals(
      "no controls for no selection",
      f.app.querySelectorAll("#face-appearance input").length,
      0,
    );
    await f.change("appearance-material", material.id);
    TestValidator.equals(
      "restored selection",
      f.element<HTMLInputElement>("appearance-g").value,
      "1",
    );
    f.dom.window.close();
  };
