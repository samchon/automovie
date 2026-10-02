import { TestValidator } from "@nestia/e2e";

import { mountHumanViewerLightControls } from "../../../scripts/human-viewer/mountHumanViewerLightControls";
import { createHumanViewerLightControlFixture } from "../internal/createHumanViewerLightControlFixture";

/**
 * Invalid form input stays visible without navigating to an invented picture.
 * Scenarios:
 * 1. Empty components report refusal and leave navigation untouched.
 * 2. Correcting the same controls clears the message and permits one navigation.
 */
export function test_human_viewer_light_controls_refusal(): void {
  const input = createHumanViewerLightControlFixture();
  let navigations = 0;
  const control = mountHumanViewerLightControls({ ...input, navigate: () => { ++navigations; } });
  control.show(null, true);
  input.form.dispatchEvent(new input.window.Event("submit", { cancelable: true }));
  TestValidator.equals("invalid input does not navigate", navigations, 0);
  TestValidator.predicate("refusal displayed", input.error.textContent !== "");
  input.components[0].value = "0";
  input.components[1].value = "1";
  input.components[2].value = "0";
  input.form.dispatchEvent(new input.window.Event("submit", { cancelable: true }));
  TestValidator.equals("corrected input navigates", navigations, 1);
  TestValidator.equals("refusal cleared", input.error.textContent, "");
  input.window.close();
}
