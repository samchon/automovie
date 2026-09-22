import { TestValidator } from "@nestia/e2e";

import {
  connectedPanelFixture,
  connectedPanelModel,
} from "../internal/connectedPanelFixture";
import { humanFaceBasisFixture } from "../internal/humanFaceBasisFixture";

/**
 * A pending region removal must not redirect an older visible field to the
 * next array element. The real panel rejects that stale identity and recovers.
 * Scenarios:
 * 1. Remove a selected field while its old input is still visible, then edit it.
 * 2. Repeat removal before completion; the neighbouring field survives both.
 * 3. Finish an edit after switching surfaces; it still belongs to its origin.
 */
export const test_subject_connected_pigmentation_races =
  async (): Promise<void> => {
    const source = humanFaceBasisFixture();
    source.document.skin = {
      square: [
        {
          name: "a",
          center: [0, 0, 0],
          radius: [1, 1, 1],
          gain: [1, 1, 1],
          strength: 0,
        },
        {
          name: "b",
          center: [0, 0, 0],
          radius: [1, 1, 1],
          gain: [1, 1, 1],
          strength: 0,
        },
      ],
    };
    const completions: (() => void)[] = [];
    let initial = true;
    const f = connectedPanelFixture({
      source,
      build: async (document) => {
        if (!initial)
          await new Promise<boolean>((resolve) => {
            completions.push(() => resolve(true));
          });
        initial = false;
        return connectedPanelModel(document);
      },
    });
    await f.panel.ready;
    const original = structuredClone(f.panel.snapshot()!.document);
    const removed = f.click("pigment-remove");
    await f.change("pigment-strength-0", ".5");
    TestValidator.equals(
      "stale identity refuses",
      f.element("face-status").dataset.state,
      "error",
    );
    completions.shift()!();
    await removed;
    TestValidator.equals(
      "cancel preserves both regions",
      f.panel.snapshot()!.document,
      original,
    );
    const again = f.click("pigment-remove");
    await f.click("pigment-remove");
    completions.shift()!();
    await again;
    TestValidator.equals(
      "repeated removal refuses safely",
      f.panel.snapshot()!.document,
      original,
    );
    const editing = f.change("pigment-strength-0", ".5");
    await f.change("pigment-surface", "attachment");
    completions.shift()!();
    await editing;
    TestValidator.equals(
      "original surface receives edit",
      f.panel.snapshot()!.document.skin!.square[0].strength,
      0.5,
    );
    TestValidator.equals(
      "newly selected surface stays absent",
      Object.hasOwn(f.panel.snapshot()!.document.skin!, "attachment"),
      false,
    );
    f.dom.window.close();
  };
