import { assertHumanCurveKinks } from "../../../../internal/curves/assertHumanCurveKinks";
import { HumanCurveKinkRegions } from "../../../../internal/curves/HumanCurveKinkRegions";

/**
 * Pins that no person's shoulder cap or arm root carries a step: every
 * meridian round the humerus, from above the shoulder joint to a quarter of
 * the humerus below it, turns no sharper than smooth skin does, on both arms.
 *
 * Scenarios:
 * 1. A Gaussian ring 3 mm high and 2 mm wide raised round each humerus' axis on a copy of f1's skin reads past the bound, at least 1.5 mm above the unedited skin.
 * 2. Every person of `HumanPeople`: both arms' lateral, anterior and posterior meridians are read, and every one past the bound is listed by person, side, azimuth, station and point.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates each person's bind skin and cuts each arm's root by half-planes through the humerus' axis (shoulder joint to elbow joint) every 15 degrees over the two thirds of the round facing away from the trunk, from 0.03 S above the shoulder joint to a quarter of the humerus below it, within 0.07 S of the axis, reading each outline's sharpest turn over a 10 mm chord at 1 mm resampling. It catches a step between the shoulder's cap and the arm's root, a ridge round the arm where the root strip meets the deltoid span, and a dent in the deltoid.
 * @evidence contracts/testing.md#independent-expectations The bound is the crease definition (`HumanAnatomyShared.CREASE`): the deltoid covers the shoulder joint in one convex cap that turns into the arm with no crease (Gray 1918); the medial third, the axilla and its anterior and posterior folds, has real creases and is not read. Proven red on f1 by a 3 mm, 2 mm-wide Gaussian ring, 2.87 mm of sagitta over the chord. Oracle limits: the axis is the rig's humerus; the A-pose of the bind is read, not the neutral.
 * @evidence contracts/testing.md#distinguishing-cases Both arms of the core set's ten people, slender and muscular shoulders of both sexes. The arm's girths and profile belong to `test_human_anatomy_arm` and the arm's composed-curve profile rules; the axilla under a pose to `test_human_anatomy_pose`.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_curves_step_shoulder`, generating each person's bind skin in process on the CPU with no renderer, browser or GPU.
 */
export function test_human_curves_step_shoulder(): void {
  const failures: string[] = [];
  for (const side of ["left", "right"] as const) {
    try {
      assertHumanCurveKinks(HumanCurveKinkRegions.shoulder(side));
    } catch (error) {
      failures.push((error as Error).message);
    }
  }
  if (failures.length !== 0) throw new Error(failures.join("\n"));
}
