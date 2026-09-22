import { TestValidator } from "@nestia/e2e";

import { connectedPanelFixture } from "../internal/connectedPanelFixture";
import { pigmentationPanelSource } from "../internal/pigmentationPanelSource";

/**
 * Regional selection and removal share document history.
 * Scenarios:
 * 1. View changes preserve authored data and edits remain on their surface.
 * 2. Remove/undo restores the exact field and deleting one region retains its peer.
 * 3. Unavailable surfaces disable creation and removal.
 */
export const test_subject_connected_pigmentation_history =
  async (): Promise<void> => {
    const f = connectedPanelFixture({ source: pigmentationPanelSource() });
    await f.panel.ready;
    const first = f.basis.surfaces[0].id;
    const authored = structuredClone(f.panel.snapshot()!.document);
    const identity = authored.skin![first][0];
    await f.change("pigment-region", "cheek");
    const other = f.basis.surfaces[1].id;
    await f.change("pigment-surface", other);
    TestValidator.equals(
      "selection preserves document",
      f.panel.snapshot()!.document,
      authored,
    );
    await f.click("pigment-add");
    await f.change("pigment-strength-0", ".5");
    TestValidator.equals(
      "first surface preserved",
      f.panel.snapshot()!.document.skin![first],
      authored.skin![first],
    );
    await f.click("pigment-remove");
    TestValidator.equals(
      "empty surface removed",
      Object.hasOwn(f.panel.snapshot()!.document.skin!, other),
      false,
    );
    await f.click("face-undo");
    TestValidator.equals(
      "undo restores field",
      f.panel.snapshot()!.document.skin![other][0].strength,
      0.5,
    );
    await f.change("pigment-surface", first);
    await f.change("pigment-region", "cheek");
    await f.click("pigment-remove");
    TestValidator.equals(
      "remove selected only",
      f.panel.snapshot()!.document.skin![first],
      [identity],
    );
    await f.change("pigment-surface", "absent");
    TestValidator.equals(
      "no creation without a surface",
      f.element<HTMLButtonElement>("pigment-add").disabled,
      true,
    );
    TestValidator.equals(
      "no removal without a field",
      f.element<HTMLButtonElement>("pigment-remove").disabled,
      true,
    );
    f.dom.window.close();
  };
