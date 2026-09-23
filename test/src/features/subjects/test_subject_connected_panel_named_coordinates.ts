import { TestValidator } from "@nestia/e2e";

import { connectedPanelFixture } from "../internal/connectedPanelFixture";
import { humanFaceBasisFixture } from "../internal/humanFaceBasisFixture";

/**
 * Fine controls read owned numerical coordinates, including prototype spellings.
 * Scenarios:
 * 1. Admitted shape and expression IDs named __proto__ and constructor display
 *    neutral zero when absent, just like an ordinary omitted coordinate.
 * 2. Editing either creates an owned scalar that survives display refresh.
 * 3. Undo restores the omitted expression's displayed zero without erasing shape.
 */
export const test_subject_connected_panel_named_coordinates =
  async (): Promise<void> => {
    const source = humanFaceBasisFixture();
    source.basis.channels[0].id = "__proto__";
    source.basis.channels[1].id = "constructor";
    const f = connectedPanelFixture({ source });
    await f.panel.ready;
    TestValidator.equals(
      "named basis is admitted",
      f.panel.snapshot()!.status,
      "ready",
    );
    TestValidator.equals(
      "omitted shape displays zero",
      f.element<HTMLInputElement>("control-__proto__").value,
      "0",
    );
    await f.change("control-__proto__", "0.5");
    TestValidator.equals(
      "owned shape displays its value",
      f.element<HTMLInputElement>("control-__proto__").value,
      "0.5",
    );
    TestValidator.equals(
      "shape is an owned numerical key",
      Object.getOwnPropertyDescriptor(
        f.panel.snapshot()!.document.shape,
        "__proto__",
      )?.value,
      0.5,
    );
    await f.change("control-kind", "expression");
    TestValidator.equals(
      "omitted expression displays zero",
      f.element<HTMLInputElement>("control-constructor").value,
      "0",
    );
    await f.change("control-constructor", "0.5");
    TestValidator.equals(
      "owned expression displays its value",
      f.element<HTMLInputElement>("control-constructor").value,
      "0.5",
    );
    await f.click("face-undo");
    TestValidator.equals(
      "undo restores omitted expression",
      f.element<HTMLInputElement>("control-constructor").value,
      "0",
    );
    TestValidator.equals(
      "undo retains shape",
      Object.getOwnPropertyDescriptor(
        f.panel.snapshot()!.document.shape,
        "__proto__",
      )?.value,
      0.5,
    );
    f.dom.window.close();
  };
