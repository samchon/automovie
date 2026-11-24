import { ROM_TOLERANCE } from "@automovie/engine";
import { AutoMovieHumanCanonicalBody } from "@automovie/human";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieHumanCanonicalBody,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import { createHumanBody } from "@automovie/motions";
import {
  poseBones,
  prepareHumanFreeCurve,
  resolveHumanPosture,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { MOTION_HUMAN_PEOPLE } from "../../../internal/people/MOTION_HUMAN_PEOPLE";

/**
 * The free-leg curve (`prepareHumanFreeCurve`) on a synthetic tuck: both feet
 * free, drawn up toward the hips and out again over the phase, the knees bent
 * forward.
 *
 * Scenarios:
 *
 * 1. Reads in reverse phase order equal reads in order, exactly: the curve is a
 *    pure function of the phase.
 * 2. Every read places each ankle on its goal: the goals lie inside the legs'
 *    reach, so the fit's own acceptance radius, the leg's length times the ROM
 *    tolerance in radians, bounds the miss.
 * 3. Every read bends each knee as a cold fit of the same goals does: the bend
 *    goal leaves one swivel, so the continued and the cold fit agree on the
 *    knee within a millimetre.
 */
export function test_motion_posture_free_curve(): void {
  // The average man of the sweep, prepared from his Human parameters.
  const prepared: IAutoMovieHumanCanonicalBody.IBody =
    AutoMovieHumanCanonicalBody.prepare(
      MOTION_HUMAN_PEOPLE["m-average"].params,
      {
        mass: MOTION_HUMAN_PEOPLE["m-average"].mass,
        id: "m-average",
      },
    );
  const body: IAutoMovieMotionHumanBody = createHumanBody(
    prepared.skeleton,
    prepared.profile,
  );
  const neutral: IAutoMovieMotionHumanPosture = {
    root: { x: 0, y: 0, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: {},
  };
  const rest: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
    body,
    resolveHumanPosture(body, neutral),
  );
  const hip = (side: "left" | "right"): IAutoMovieVector3 =>
    rest.get(`${side}UpperLeg`)!.worldPosition;
  const length: number =
    rest.get("leftUpperLeg")!.worldPosition.y -
    rest.get("leftFoot")!.worldPosition.y;
  const at = (share: number): IAutoMovieMotionHumanPosture => {
    const tuck: number = Math.sin(Math.PI * share);
    const leg = (
      side: "left" | "right",
    ): { point: IAutoMovieVector3; bend: IAutoMovieVector3 } => {
      const h: IAutoMovieVector3 = hip(side);
      return {
        point: {
          x: h.x,
          y: h.y - length * (0.9 - 0.35 * tuck),
          z: h.z + 0.2 * tuck,
        },
        bend: { x: h.x, y: h.y - 0.45 * length, z: h.z + 0.6 },
      };
    };
    return {
      ...neutral,
      limbs: { leftLeg: leg("left"), rightLeg: leg("right") },
    };
  };
  const curve: prepareHumanFreeCurve.IReader = prepareHumanFreeCurve(
    body,
    at,
    0.6,
  );
  const shares: number[] = Array.from(
    { length: 25 },
    (_: unknown, i: number): number => (i + 0.5) / 25,
  );
  const read = (share: number): IAutoMoviePose => curve(share).pose;
  const forward: IAutoMoviePose[] = shares.map(read);
  const backward: IAutoMoviePose[] = [...shares].reverse().map(read).reverse();
  TestValidator.equals("reads in any order agree", backward, forward);

  const radians: number = (ROM_TOLERANCE * Math.PI) / 180;
  shares.forEach((share: number, i: number): void => {
    const shown: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      forward[i]!,
    );
    const cold: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      resolveHumanPosture(body, at(share)),
    );
    const goals: IAutoMovieMotionHumanPosture["limbs"] = at(share).limbs;
    for (const side of ["left", "right"] as const) {
      const foot: IAutoMovieVector3 = shown.get(`${side}Foot`)!.worldPosition;
      const goal: IAutoMovieVector3 = goals[`${side}Leg`]!.point;
      TestValidator.predicate(
        `the ${side} ankle reaches its goal at ${share}`,
        Math.hypot(foot.x - goal.x, foot.y - goal.y, foot.z - goal.z) <=
          length * radians,
      );
      const knee: IAutoMovieVector3 = shown.get(
        `${side}LowerLeg`,
      )!.worldPosition;
      const expected: IAutoMovieVector3 = cold.get(
        `${side}LowerLeg`,
      )!.worldPosition;
      TestValidator.predicate(
        `the ${side} knee agrees with a cold fit at ${share}`,
        Math.hypot(
          knee.x - expected.x,
          knee.y - expected.y,
          knee.z - expected.z,
        ) <= 1e-3,
      );
    }
  });
}
