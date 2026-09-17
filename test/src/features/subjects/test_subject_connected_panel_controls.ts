import { TestValidator } from "@nestia/e2e";

import { connectedPanelFixture } from "../internal/connectedPanelFixture";

/**
 * Connected controls retain one committed numerical document.
 *
 * Scenarios:
 * 1. Slider staging, number commit and shape/expression selection preserve state.
 * 2. Presets, undo, redo and reset use the same transaction owner.
 * 3. View, clay and shadow controls change presentation without editing the face.
 */
export const test_subject_connected_panel_controls =
  async (): Promise<void> => {
    const f = connectedPanelFixture();
    TestValidator.equals("no unbuilt snapshot", f.panel.snapshot(), undefined);
    await f.panel.ready;
    TestValidator.equals("initial fit", f.fits(), 1);
    const slider = f.element<HTMLInputElement>("control-width-slider");
    slider.value = "0.4";
    slider.oninput!.call(slider, new f.dom.window.InputEvent("input"));
    TestValidator.equals(
      "slider stages number",
      f.element<HTMLInputElement>("control-width").value,
      "0.4",
    );
    await f.change("control-width-slider", "0.4");
    TestValidator.equals(
      "shape committed",
      f.panel.snapshot()!.document.shape,
      { width: 0.4 },
    );
    await f.change("control-kind", "expression");
    await f.change("control-lift", "0.2");
    TestValidator.equals(
      "groups remain independent",
      f.panel.snapshot()!.document.shape,
      { width: 0.4 },
    );
    const preset = f.app.querySelector<HTMLButtonElement>("#presets button")!;
    await preset.onclick!.call(
      preset,
      new f.dom.window.MouseEvent("click") as PointerEvent,
    );
    TestValidator.equals(
      "preset committed",
      f.panel.snapshot()!.document.expression,
      { lift: 0.5 },
    );
    await f.click("face-undo");
    TestValidator.equals("undo", f.panel.snapshot()!.document.expression, {
      lift: 0.2,
    });
    await f.click("face-redo");
    TestValidator.equals("redo", f.panel.snapshot()!.document.expression, {
      lift: 0.5,
    });
    await f.click("face-reset");
    TestValidator.equals("reset", f.panel.snapshot()!.document, f.document);
    await f.click("fit-view");
    for (const button of f.app.querySelectorAll<HTMLButtonElement>(
      "[data-view]",
    ))
      button.onclick!.call(
        button,
        new f.dom.window.MouseEvent("click") as PointerEvent,
      );
    for (const id of ["clay", "shadows"]) {
      const input = f.element<HTMLInputElement>(id);
      input.checked = false;
      await f.change(id, "");
      input.checked = true;
      await f.change(id, "");
    }
    TestValidator.equals("directions", f.views, [0, 45, -45, 90, -90, 180]);
    TestValidator.equals("clay presentation", f.clays, [false, true]);
    TestValidator.equals("shadows presentation", f.shadows, [false, true]);
    TestValidator.equals(
      "display preserves document",
      f.panel.snapshot()!.document,
      f.document,
    );
    f.dom.window.close();
  };
