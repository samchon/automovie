import { createHumanBodyBasisBuilder } from "@automovie/human";
import type { IAutoMovieJointPose } from "@automovie/interface";
import { renderBodyPoseControls } from "@automovie/playground/src/human/body/bodyPoseControls";
import { TestValidator } from "@nestia/e2e";
import { JSDOM } from "jsdom";

import { humanBodyPelvisFixture } from "../internal/humanBodyPelvisFixture";
import { throwsError } from "../internal/predicates";

/**
 * Displayed limits use the same effective override/default owner as admission;
 * a null nonroot override cannot label an engine-bounded joint as a free root.
 *
 * Scenarios:
 * 1. Chest with a null override shows the engine's [-20,40] flexion range;
 *    after tilt20, authored20 passes and20.5 refuses its actual40.5.
 * 2. An explicit range supersedes the default and a default held axis is
 *    disabled at zero; the actual root retains its free orientation controls.
 */
export const test_human_body_pose_controls_fallback = (): void => {
  const { basis, document } = humanBodyPelvisFixture();
  const extra = structuredClone(basis.joints.find((one) => one.bone === "spine")!);
  extra.bone = "chest";
  extra.constraint = null;
  basis.joints.push(extra);
  const dom = new JSDOM("<!doctype html><main></main>").window.document;
  const container = dom.querySelector<HTMLElement>("main")!;
  const render = (bone: IAutoMovieJointPose["bone"]) => renderBodyPoseControls({ dom, container, basis, bone, pose: [], onChange: () => {} });
  render("chest");
  const field = (bone: string, axis: string) => dom.querySelector<HTMLInputElement>(`#pose-${bone}-${axis}`)!;
  TestValidator.equals("default flexion is displayed", [field("chest", "flexion").min, field("chest", "flexion").max], ["-20", "40"]);
  TestValidator.predicate("nonroot has no free-root label", !container.textContent!.includes("root turns freely"));
  const build = createHumanBodyBasisBuilder(basis);
  const pose = (flexion: number): IAutoMovieJointPose[] => [{ bone: "leftUpperLeg", flexion: 100, abduction: null, twist: null }, { bone: "chest", flexion, abduction: null, twist: null }];
  TestValidator.predicate("exact default endpoint passes", build({ ...document, pose: pose(20) }).bones.length > 0);
  TestValidator.predicate("adjacent actual default overshoot refuses", throwsError(() => build({ ...document, pose: pose(20.5) }), "chest"));
  extra.constraint = { flexion: { min: -10, max: 30 }, abduction: null, twist: null };
  render("chest");
  TestValidator.equals("override supersedes default", [field("chest", "flexion").min, field("chest", "flexion").max], ["-10", "30"]);
  extra.bone = "jaw";
  extra.constraint = null;
  render("jaw");
  TestValidator.equals("default held axis remains held", [field("jaw", "twist").min, field("jaw", "twist").max, field("jaw", "twist").disabled], ["0", "0", true]);
  render("hips");
  TestValidator.equals("actual root stays free", [field("hips", "flexion").min, field("hips", "flexion").max, field("hips", "flexion").disabled], ["-180", "180", false]);
  TestValidator.predicate("only actual root gets free-root label", container.textContent!.includes("root turns freely"));
  const root = basis.joints.find((one) => one.bone === "hips")!;
  root.parent = "spine";
  render("hips");
  TestValidator.predicate("a malformed nonroot cannot get a free-root claim", !container.textContent!.includes("root turns freely") && container.textContent!.includes("no source-rig range"));
};
