import {
  resolveAutoMovieCenterOfMass,
  resolveHydrodynamicForce,
  resolvePose,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieIntegrateMotionTrajectory,
  IAutoMovieMotionHumanBody,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanWater } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { nclose } from "../../../features/internal/nclose";

/**
 * Isolate the sign and magnitude of the stroke force on moving segments.
 *
 * Scenarios:
 * 1. One bone moves back in the water while a dry bone moves equally forward.
 *    With the volumes on the wet bone fully immersed, their full sphere
 *    cross-sections give the acceleration at midstroke to within 2 percent.
 * 2. Reverse both motions. The same medium gives opposite travel, and a
 *    still prescribed shape gives no travel from rest.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the wet and dry motion, the bound and the controls.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the integrated speed and displacement through HumanWater.stroke so use of one shared velocity, inclusion of dry drag or an incorrect force sign fails.
 * @evidence contracts/development/testing.md#independent-expectations Differentiates the authored smoothstep analytically and computes the full sphere area to predict the speed derivative independently of the integrator.
 * @evidence contracts/development/testing.md#distinguishing-cases The dry limb supplies a counter-motion, reversal checks the sign, and the held pose distinguishes stroke drag from a prescribed drift.
 * @evidence contracts/development/testing.md#execution-ownership Uses a canonical body and three short in-memory phase trajectories without a viewer or physical solver.
 */
export function test_motion_swim_water_relative_stroke(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const model: IAutoMovieResolveCenterOfMass.IModel =
    resolveAutoMovieCenterOfMass(body.skeleton, body.profile);
  const wet: AutoMovieHumanoidBone = "rightLowerArm";
  const dry: AutoMovieHumanoidBone = "leftLowerArm";
  const direction: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };
  const density: number = 1000;
  const rest: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    new Map(
      resolvePose(
        { skeleton: body.skeleton.id, root: null, joints: [] },
        body.skeleton,
      ).map(
        (
          bone: IAutoMovieResolvedBone,
        ): [AutoMovieHumanoidBone, IAutoMovieResolvedBone] => [
          bone.bone,
          {
            ...bone,
            worldPosition: {
              ...bone.worldPosition,
              y: bone.bone === wet ? -10 : 10,
            },
          },
        ],
      ),
    );
  const wetRest: IAutoMovieResolvedBone = rest.get(wet)!;
  const dryRest: IAutoMovieResolvedBone = rest.get(dry)!;

  /** Oppose motions at equal speeds while keeping only the named bone wet. */
  const plan = (
    amplitude: number,
  ): IAutoMovieIntegrateMotionTrajectory.ITrajectory =>
    HumanWater.stroke(
      body,
      (
        phase: number,
      ): ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> => {
        if (amplitude === 0) return rest;

        // Only the counter-moving pair changes. Keep every other bone fixed.
        const shift: number = amplitude * phase ** 2 * (3 - 2 * phase);
        return new Map(rest)
          .set(wet, {
            ...wetRest,
            worldPosition: {
              ...wetRest.worldPosition,
              x: wetRest.worldPosition.x - shift,
            },
          })
          .set(dry, {
            ...dryRest,
            worldPosition: {
              ...dryRest.worldPosition,
              x: dryRest.worldPosition.x + shift,
            },
          });
      },
      direction,
      { surface: 0, density },
    );

  const area: number = model.segments.reduce(
    (
      sum: number,
      segment: IAutoMovieResolveCenterOfMass.ISegment,
      index: number,
    ): number => {
      if (segment.bone !== wet) return sum;
      const volume: number = resolveHydrodynamicForce.volume(
        body.profile.segments[index]!,
      );
      return sum + Math.PI * Math.cbrt((3 * volume) / (4 * Math.PI)) ** 2;
    },
    0,
  );
  const forward: IAutoMovieIntegrateMotionTrajectory.ITrajectory = plan(1);
  const reverse: IAutoMovieIntegrateMotionTrajectory.ITrajectory = plan(-1);
  const still: IAutoMovieIntegrateMotionTrajectory.ITrajectory = plan(0);
  const middle: number = 0.5;
  const h: number = 1 / 120;
  const relative: number = forward.at(middle).x[1]! - 1.5;
  const acceleration: number =
    (forward.at(middle + h).x[1]! - forward.at(middle - h).x[1]!) / (2 * h);
  const expected: number =
    (-0.5 *
      density *
      resolveHydrodynamicForce.DRAG *
      area *
      Math.abs(relative) *
      relative) /
    body.profile.mass;
  TestValidator.predicate(
    "the wet segment's relative velocity supplies the longitudinal acceleration",
    expected > 0 && nclose(acceleration, expected, 0.02 * expected),
  );
  const travel: number = forward.at(1).x[0]!;
  TestValidator.predicate(
    "opposite wet motion reverses travel and a held shape does not drift",
    travel > 0 &&
      nclose(reverse.at(1).x[0]!, -travel, 1e-9) &&
      still.at(1).x[0] === 0,
  );
}
