import { TestValidator } from "@nestia/e2e";

import type { HumanViewerAddress } from "../../../scripts/human-viewer/HumanViewerAddress";
import { applyHumanViewerVisibility } from "../../../scripts/human-viewer/applyHumanViewerVisibility";
import { parseHumanViewerAddress } from "../../../scripts/human-viewer/parseHumanViewerAddress";

/**
 * The cached Body/Person stage receives an explicit direction or studio reset.
 * Scenarios:
 * 1. A rim override reaches its supported setter before pass and visibility changes.
 * 2. Modern null and legacy absence each restore the studio on the next show.
 */
export function test_human_viewer_light_visibility(): void {
  const lights: HumanViewerAddress["light"][] = [];
  const order: string[] = [];
  const stage = { setLightDirection: (light: HumanViewerAddress["light"]): void => { lights.push(light); order.push("light"); },
    setShadows: (): void => { order.push("shadows"); }, observe: {
      pass: (): void => { order.push("pass"); }, isolate: (): string[] => [], hide: (): string[] => [],
    } };
  const selected = parseHumanViewerAddress("light=rim,0.5,-1.5,-1.25");
  applyHumanViewerVisibility(stage, selected);
  applyHumanViewerVisibility(stage, parseHumanViewerAddress(""));
  applyHumanViewerVisibility(stage, { pass: "clay", parts: [], hide: [] });
  TestValidator.equals("setter selection then resets", lights, [selected.light, null, null]);
  TestValidator.equals("scene order", order, ["light", "shadows", "pass", "light", "shadows", "pass", "light", "shadows", "pass"]);
}
