import type { IAutoMovieJointPose } from "@automovie/interface";
import { renderBodyPoseControls } from "@automovie/playground/src/human/body/bodyPoseControls";
import { TestValidator } from "@nestia/e2e";
import { JSDOM } from "jsdom";

import { humanBodyPelvisFixture } from "../internal/humanBodyPelvisFixture";

/**
 * A resolved reading is distinct from the authored slider and coordination
 * increment, and covers every clinical axis the composed frame changes.
 *
 * Scenarios:
 * 1. A combined hypothetical frame reading prints all three resolved values,
 *    while the input and flexion coordination increment keep their own meanings.
 * 2. Another bone's reading does not appear on the selected joint, and an
 *    unavailable coordinate is named rather than filled with an angle.
 */
export const test_human_body_pose_controls_resolved = (): void => {
  const { basis } = humanBodyPelvisFixture();
  const dom = new JSDOM("<!doctype html><main></main>").window.document;
  const container = dom.querySelector<HTMLElement>("main")!;
  const clinical: IAutoMovieJointPose = { bone: "leftUpperLeg", flexion: 38, abduction: 42, twist: 36 };
  const render = (reading: IAutoMovieJointPose): void => renderBodyPoseControls({
    dom, container, basis, bone: "leftUpperLeg",
    pose: [{ bone: "leftUpperLeg", flexion: 50, abduction: 40, twist: 45 }],
    clinical: [reading],
    coupled: [{ bone: "leftUpperLeg", axis: "flexion", coupling: "pelvic", degrees: -10 }],
    onChange: () => {},
  });
  render(clinical);
  for (const axis of ["flexion", "abduction", "twist"] as const)
    TestValidator.equals(`${axis} reports the composed frame`, dom.querySelector(`#pose-leftUpperLeg-${axis}-clinical`)?.textContent, `resolved source-rig ${axis} ${clinical[axis]!.toFixed(6)}°`);
  TestValidator.equals("authored slider stays authored", dom.querySelector<HTMLInputElement>("#pose-leftUpperLeg-flexion")?.value, "50");
  TestValidator.equals("coordination is not a total", dom.querySelector("#pose-leftUpperLeg-flexion-coupled")?.textContent, "coupled -10.0° by pelvic");
  render({ ...clinical, bone: "rightUpperLeg" });
  TestValidator.equals("another bone's clinical reading is absent", container.querySelectorAll("output[id$='clinical']").length, 0);
  render({ ...clinical, twist: null });
  TestValidator.equals("unavailable coordinate stays unavailable", dom.querySelector("#pose-leftUpperLeg-twist-clinical")?.textContent, "resolved source-rig twist unavailable");
};
