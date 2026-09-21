import { TestValidator } from "@nestia/e2e";

import { connectedPanelFixture } from "../internal/connectedPanelFixture";

/**
 * Regional colour authoring reaches the actual numerical builder and shared
 * document history. View selection must never change another surface's fields.
 * Scenarios:
 * 1. Add two identity envelopes, then edit every tuple axis in displayed mm/RGB.
 * 2. Rename a selected region, keeping the other independently authored region.
 */
export const test_subject_connected_panel_pigmentation =
  async (): Promise<void> => {
    const f = connectedPanelFixture();
    await f.panel.ready;
    const first = f.basis.surfaces[0].id;
    TestValidator.equals(
      "empty",
      f.app.querySelectorAll("#face-pigmentation input").length,
      0,
    );
    await f.click("pigment-add");
    const identity = f.panel.snapshot()!.document.skin![first][0];
    TestValidator.equals("neutral new field", identity, {
      name: "Region 1",
      center: [0, 0, 0],
      radius: [0.01, 0.01, 0.01],
      gain: [1, 1, 1],
      strength: 0,
    });
    await f.click("pigment-add");
    await f.change("pigment-region", "Region 2");
    await f.change("pigment-name", "cheek");
    await f.change("pigment-region", "cheek");
    for (const [key, values] of [
      ["center", [40, -10, 130]],
      ["radius", [35, 25, 30]],
      ["gain", [1, 0.25, 0]],
    ] as const)
      for (let axis = 0; axis < 3; axis++)
        await f.change(`pigment-${key}-${axis}`, String(values[axis]));
    await f.change("pigment-strength-0", "1");
    const authored = structuredClone(f.panel.snapshot()!.document);
    TestValidator.equals("metric authored field", authored.skin![first][1], {
      name: "cheek",
      center: [0.04, -0.01, 0.13],
      radius: [0.035, 0.025, 0.03],
      gain: [1, 0.25, 0],
      strength: 1,
    });
    f.dom.window.close();
  };
