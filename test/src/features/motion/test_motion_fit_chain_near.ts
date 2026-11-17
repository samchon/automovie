import type { IAutoMovieMotionHumanBody, IAutoMovieResolvedBone, IAutoMovieSeededChainFit, IAutoMovieSwivelSeed, IAutoMoviePose, IAutoMovieVector3 } from "@automovie/interface";
import { HUMANOID_JOINT_AXES, HUMANOID_REST_FRAME, Vector3, fitSeededChainToTarget, hingedArmSwivel, resolvePose, samplePoseVelocity } from "@automovie/engine";


import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * The polygon man's arm, fitted to a moving wrist target and continued from
 * its fit a moment earlier, is the arm the full fit gives.
 *
 * The average man's left wrist is sent along a line ahead of his shoulder at
 * 0.36 m/s. The fit at 0 s names its seed; the fits at 1 and 2 ms are made
 * twice, by the full sweep and continued from that seed to the tolerance a
 * 1 ms velocity read for a 0.4 s inertialization needs
 * (`samplePoseVelocity.tolerance`).
 *
 * Scenarios:
 * 1. The fit at 0 s is the hinged chain's, so it names a seed.
 * 2. At 1 and 2 ms the continued fit names the full fit's branch and a
 *    swivel within the tolerance plus the sweep's resolution
 *    (`hingedArmSwivel.RESOLUTION`) of the full fit's.
 * 3. Its wrist lands where the full fit's does, within 1 micrometre, and its
 *    elbow within the swivel's difference times the upper arm's length.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the public seeded fit on the polygon man and reads the seed it names and the joints through forward kinematics; a seed not named, a continued fit on another branch, a swivel off by more than its tolerance or a wrist moved fails.
 * @evidence contracts/development/testing.md#independent-expectations The expected arm is the full sweep's own answer for the same target, and the bounds are the tolerance, the sweep's resolution and the arm's length.
 * @evidence contracts/development/testing.md#distinguishing-cases The fit that names a seed, and two continued fits at increasing distance from it.
 * @evidence contracts/development/testing.md#execution-ownership In memory on one prepared body; it runs wherever CI runs the motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the body, the motion, the tolerance and the 3 scenarios with their bounds.
 */
export function test_motion_fit_chain_near(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const pose: IAutoMoviePose = {
    skeleton: body.skeleton.id,
    root: null,
    joints: [],
  };
  const bones = (of: IAutoMoviePose): Map<string, IAutoMovieResolvedBone> =>
    new Map(
      resolvePose(
        of,
        body.skeleton,
        HUMANOID_JOINT_AXES,
        HUMANOID_REST_FRAME,
      ).map((r: IAutoMovieResolvedBone): [string, IAutoMovieResolvedBone] => [
        r.bone,
        r,
      ]),
    );
  const shoulder: IAutoMovieVector3 =
    bones(pose).get("leftUpperArm")!.worldPosition;
  const target = (t: number): IAutoMovieVector3 => ({
    x: shoulder.x + 0.15 + 0.3 * t,
    y: shoulder.y - 0.35 + 0.2 * t,
    z: shoulder.z + 0.25,
  });
  const fit = (
    t: number,
    seed?: IAutoMovieSwivelSeed,
  ): IAutoMovieSeededChainFit =>
    fitSeededChainToTarget({
      skeleton: body.skeleton,
      pose,
      chain: {
        upper: "leftUpperArm",
        lower: "leftLowerArm",
        effector: "leftHand",
      },
      target: target(t),
      topology: body.topology,
      jointAxes: HUMANOID_JOINT_AXES,
      restFrames: HUMANOID_REST_FRAME,
      ...(seed === undefined
        ? {}
        : {
            near: {
              ...seed,
              tolerance: samplePoseVelocity.tolerance(1e-3, 0.4),
            },
          }),
    });

  // 1. The fit at the instant names its seed.
  const first: IAutoMovieSeededChainFit = fit(0);
  TestValidator.predicate("the hinged fit names a seed", first.seed !== null);
  const seed: IAutoMovieSwivelSeed = first.seed!;
  const length: number = Vector3.length(
    Vector3.subtract(
      bones(first.pose).get("leftLowerArm")!.worldPosition,
      shoulder,
    ),
  );

  for (const t of [1e-3, 2e-3]) {
    const swept: IAutoMovieSeededChainFit = fit(t);
    const continued: IAutoMovieSeededChainFit = fit(t, seed);
    // 2. The same branch, the swivel within the tolerance and the resolution.
    const apart: number = Math.abs(
      ((continued.seed!.swivel - swept.seed!.swivel + 540) % 360) - 180,
    );
    TestValidator.predicate(
      `at ${t * 1000} ms the continued fit is the full fit's (${apart} degrees apart)`,
      continued.seed!.branch === swept.seed!.branch &&
        apart <=
          samplePoseVelocity.tolerance(1e-3, 0.4) + hingedArmSwivel.RESOLUTION,
    );
    // 3. The same wrist, and the elbow within the swivel's difference.
    const ours: Map<string, IAutoMovieResolvedBone> = bones(continued.pose);
    const theirs: Map<string, IAutoMovieResolvedBone> = bones(swept.pose);
    const gap = (bone: string): number =>
      Vector3.length(
        Vector3.subtract(
          ours.get(bone)!.worldPosition,
          theirs.get(bone)!.worldPosition,
        ),
      );
    TestValidator.predicate(
      `at ${t * 1000} ms the wrist lands alike (${gap("leftHand")} m)`,
      gap("leftHand") <= 1e-6 &&
        gap("leftLowerArm") <= ((apart * Math.PI) / 180) * length + 1e-9,
    );
  }
}
