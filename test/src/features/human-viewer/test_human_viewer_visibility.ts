import { TestValidator } from "@nestia/e2e";

import { applyHumanViewerVisibility } from "../../../scripts/human-viewer/applyHumanViewerVisibility";
import { parseHumanViewerAddress } from "../../../scripts/human-viewer/parseHumanViewerAddress";

/**
 * Each show restores visibility on a reused product viewport before framing.
 * Scenarios:
 * 1. On/off/on calls restore the light setter for every capture in display order.
 * 2. Empty part sets clear prior isolation and hiding through null hook inputs.
 * 3. Nonempty part sets reach their respective product hooks without mutation.
 * 4. A legacy Node transport without the new field preserves enabled shadows.
 */
export function test_human_viewer_visibility(): void {
  const calls: unknown[] = [];
  const stage = {
    setShadows: (enabled: boolean): void => { calls.push(["shadows", enabled]); },
    observe: {
      pass: (pass: string): void => { calls.push(["pass", pass]); },
      isolate: (parts: string[] | null): string[] => { calls.push(["isolate", parts]); return []; },
      hide: (parts: string[] | null): string[] => { calls.push(["hide", parts]); return []; },
    },
  };
  const selected = parseHumanViewerAddress("pass=clay&parts=skin&hide=hair");
  applyHumanViewerVisibility(stage, selected);
  applyHumanViewerVisibility(stage, parseHumanViewerAddress("shadows=off"));
  applyHumanViewerVisibility(stage, parseHumanViewerAddress("shadows=on"));
  applyHumanViewerVisibility(stage, { pass: "beauty", parts: [], hide: [] });
  TestValidator.equals("state restored in display order", calls, [
    ["shadows", true], ["pass", "clay"], ["isolate", ["skin"]], ["hide", ["hair"]],
    ["shadows", false], ["pass", "beauty"], ["isolate", null], ["hide", null],
    ["shadows", true], ["pass", "beauty"], ["isolate", null], ["hide", null],
    ["shadows", true], ["pass", "beauty"], ["isolate", null], ["hide", null],
  ]);
  TestValidator.equals("caller isolation unchanged", selected.parts, ["skin"]);
  TestValidator.equals("caller hidden set unchanged", selected.hide, ["hair"]);
}
