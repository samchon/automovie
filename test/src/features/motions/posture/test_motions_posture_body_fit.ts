import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanBodyFitTypes,
  IAutoMovieMotionHumanJacobian,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanBodyFit,
  poseBones,
  resolveHumanPosture,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { vclose } from "../../internal/vclose";

/** The left arm's clinical angles: the variables the fit moves. */
const ARM: readonly IAutoMovieMotionHumanJacobian.IVariable[] = [
  { kind: "angle", bone: "leftUpperArm", axis: 0 },
  { kind: "angle", bone: "leftUpperArm", axis: 1 },
  { kind: "angle", bone: "leftUpperArm", axis: 2 },
  { kind: "angle", bone: "leftLowerArm", axis: 0 },
];

/**
 * `HumanBodyFit.fit` is the whole-body static fit: the posture nearest the
 * preferred one in joint space whose targets, joint ranges and floor hold, an
 * elastic l1 sequential quadratic program over the posed body's analytic
 * Jacobian; its residuals are each target's miss in millimetres, `feasible`
 * says every row holds to the tolerance, `converged` that the loop ended so.
 *
 * The body is built whole (`humanFixtureBody`): the fit reads its rig, ranges
 * and colliders. The average man stands with his arms 25 degrees out; only the
 * left arm's four angles move.
 *
 * Scenarios:
 *
 * 1. With no target the fit keeps the preferred posture, feasible.
 * 2. The left wrist brought 15 cm up and 20 cm forward lands there within the
 *    fit's tolerance, converged and feasible, and the right arm, not a
 *    variable, stays.
 * 3. A wrist goal two metres away, past the arm's reach, is not feasible, its
 *    residual over a metre.
 */
export async function test_motions_posture_body_fit(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const standing: IAutoMovieMotionHumanPosture = {
    root: { x: 0, y: body.measure.hipHeight, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    // The arms held 25 degrees out, clear of the trunk's colliders: at rest the
    // fixture's arm lies within the fit's clearance of the trunk.
    joints: { leftUpperArm: [0, 25, 0], rightUpperArm: [0, 25, 0] },
    limbs: {},
  };
  const bones = (
    posture: IAutoMovieMotionHumanPosture,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
    poseBones(body, resolveHumanPosture(body, posture));
  const rest: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    bones(standing);
  const wrist: IAutoMovieVector3 = rest.get("leftHand")!.worldPosition;
  const fit = (
    goal?: IAutoMovieVector3,
  ): IAutoMovieMotionHumanBodyFitTypes.IResult =>
    HumanBodyFit.fit({
      body,
      posture: standing,
      variables: ARM,
      targets: goal === undefined ? [] : [{ bone: "leftHand", goal }],
    });

  // 1. No target.
  const still: IAutoMovieMotionHumanBodyFitTypes.IResult = fit();
  TestValidator.predicate(
    "no target keeps the preferred posture",
    still.feasible &&
      vclose(bones(still.posture).get("leftHand")!.worldPosition, wrist, 1e-9),
  );

  // 2. A reachable goal.
  const goal: IAutoMovieVector3 = {
    x: wrist.x,
    y: wrist.y + 0.15,
    z: wrist.z + 0.2,
  };
  const reached: IAutoMovieMotionHumanBodyFitTypes.IResult = fit(goal);
  const shown: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = bones(
    reached.posture,
  );
  TestValidator.predicate(
    "the wrist on its goal, the other arm still",
    reached.feasible &&
      reached.converged &&
      reached.residuals[0]!.point <= HumanBodyFit.TOLERANCE * 1000 &&
      vclose(
        shown.get("leftHand")!.worldPosition,
        goal,
        HumanBodyFit.TOLERANCE,
      ) &&
      vclose(
        shown.get("rightHand")!.worldPosition,
        rest.get("rightHand")!.worldPosition,
        1e-9,
      ),
  );

  // 3. Out of reach.
  const far: IAutoMovieMotionHumanBodyFitTypes.IResult = fit({
    x: wrist.x + 2,
    y: wrist.y,
    z: wrist.z,
  });
  TestValidator.predicate(
    "an unreachable goal is not feasible",
    !far.feasible && far.residuals[0]!.point > 1000,
  );
}
