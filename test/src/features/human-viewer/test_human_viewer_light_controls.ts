import { TestValidator } from "@nestia/e2e";

import type { HumanViewerAddress } from "../../../scripts/human-viewer/HumanViewerAddress";
import { mountHumanViewerLightControls } from "../../../scripts/human-viewer/mountHumanViewerLightControls";
import { createHumanViewerLightControlFixture } from "../internal/createHumanViewerLightControlFixture";

/**
 * The real light control component projects bookmark state and navigation.
 * Scenarios:
 * 1. A supported rim address shows its raw coordinates, and submit emits that selection.
 * 2. Reset emits null; showing default clears coordinates without inventing a direction.
 * 3. An unsupported Face document hides the form.
 */
export function test_human_viewer_light_controls(): void {
  const input = createHumanViewerLightControlFixture();
  const selections: HumanViewerAddress["light"][] = [];
  const control = mountHumanViewerLightControls({ ...input, navigate: (light) => { selections.push(light); } });
  const selected: HumanViewerAddress["light"] = { name: "rim", direction: [0.5, -1.5, -1.25] };
  control.show(selected, true);
  TestValidator.equals("supported form shown", input.form.hidden, false);
  TestValidator.equals("address values projected", [input.name.value, ...input.components.map((field) => field.value)], ["rim", "0.5", "-1.5", "-1.25"]);
  input.form.dispatchEvent(new input.window.Event("submit", { cancelable: true }));
  input.reset.dispatchEvent(new input.window.Event("click"));
  TestValidator.equals("selection and reset", selections, [selected, null]);
  control.show(null, true);
  TestValidator.equals("default has no custom direction", input.components.map((field) => field.value), ["", "", ""]);
  control.show(null, false);
  TestValidator.equals("face hides body light controls", input.form.hidden, true);
  input.window.close();
}
