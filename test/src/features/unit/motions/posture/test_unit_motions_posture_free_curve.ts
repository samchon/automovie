import { ROM_TOLERANCE } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  poseBones,
  prepareHumanFreeCurve,
  resolveHumanPosture,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";

/** How near a continued knee lies to a cold fit's, metres: a millimetre. */
const KNEE: number = 1e-3;

/** Both legs. */
const SIDES: readonly ("left" | "right")[] = ["left", "right"];

/** The phases read: 25 midpoints of [0, 1]. */
const SHARES: readonly number[] = Array.from(
  { length: 25 },
  (_: unknown, i: number): number => (i + 0.5) / 25,
);

/**
 * `prepareHumanFreeCurve` is the free legs' curve over a phase: each read fits
 * the phase's leg goals, continued from the read before, and is a pure function
 * of the phase.
 *
 * The body is built whole (`humanFixtureBody`): the curve fits its legs. A
 * synthetic tuck on the average man: both feet free, drawn up toward the hips
 * and out again, `y = hip − L (0.9 − 0.35 sin πu)`, `z = hip + 0.2 sin πu`, the
 * knees bent forward.
 *
 * Scenarios, 25 phases:
 *
 * 1. Reads in reverse order equal reads in order, exactly.
 * 2. Each ankle lies on its goal within the fit's acceptance radius, the leg's
 *    length times the ROM tolerance in radians.
 * 3. Each knee lies within a millimetre of a cold fit's: the bend goal leaves one
 *    swivel.
 */
export async function test_unit_motions_posture_free_curve(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
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
  const length: number =
    rest.get("leftUpperLeg")!.worldPosition.y -
    rest.get("leftFoot")!.worldPosition.y;
  const at = (share: number): IAutoMovieMotionHumanPosture => {
    const tuck: number = Math.sin(Math.PI * share);
    const leg = (
      side: "left" | "right",
    ): { point: IAutoMovieVector3; bend: IAutoMovieVector3 } => {
      const h: IAutoMovieVector3 = rest.get(`${side}UpperLeg`)!.worldPosition;
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
  const read = (share: number): IAutoMoviePose => curve(share).pose;

  // 1. Pure.
  const forward: IAutoMoviePose[] = SHARES.map(read);
  TestValidator.equals(
    "reads in any order agree",
    [...SHARES].reverse().map(read).reverse(),
    forward,
  );

  // 2 and 3. On the goals, as a cold fit.
  const radius: number = (length * ROM_TOLERANCE * Math.PI) / 180;
  const distance = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
    Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  TestValidator.predicate(
    "the ankles on their goals and the knees as a cold fit",
    SHARES.every((share: number, i: number): boolean => {
      const shown: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        poseBones(body, forward[i]!);
      const cold: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        poseBones(body, resolveHumanPosture(body, at(share)));
      return SIDES.every(
        (side: "left" | "right"): boolean =>
          distance(
            shown.get(`${side}Foot`)!.worldPosition,
            at(share).limbs[`${side}Leg`]!.point,
          ) <= radius &&
          distance(
            shown.get(`${side}LowerLeg`)!.worldPosition,
            cold.get(`${side}LowerLeg`)!.worldPosition,
          ) <= KNEE,
      );
    }),
  );
}
