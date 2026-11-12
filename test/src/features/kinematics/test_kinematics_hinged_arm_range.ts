import {
  type IAutoMovieHingedArticulation,
  hingedArmArticulation,
} from "@automovie/engine";
import { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

const IDENTITY: { x: number; y: number; z: number; w: number } = {
  x: 0,
  y: 0,
  z: 0,
  w: 1,
};

/** A 0.3 + 0.25 chain along +X with a +Y hinge, the mid joint limited to a quarter turn either way. */
const chain: (
  target: IAutoMovieVector3,
  range?: { min: number; max: number },
) => IAutoMovieHingedArticulation = (
  target: IAutoMovieVector3,
  range?: { min: number; max: number },
): IAutoMovieHingedArticulation =>
  hingedArmArticulation({
    upper: {
      worldPosition: { x: 0, y: 0, z: 0 },
      worldRotation: IDENTITY,
    },
    midOffset: { x: 0.3, y: 0, z: 0 },
    midRest: IDENTITY,
    endOffset: { x: 0.25, y: 0, z: 0 },
    hinge: { x: 0, y: 1, z: 0 },
    target,
    ...(range === undefined ? {} : { range }),
    score: (): { overshoot: number; deviation: number } => ({
      overshoot: 0,
      deviation: 0,
    }),
  })!;

/**
 * The hinge solve's stop at the mid joint's own range, and the shortfall it
 * reports.
 *
 * A `0.3 + 0.25` chain reaches a distance `d` at the hinge angle whose cosine
 * is `(d^2 - 0.3^2 - 0.25^2) / (2 * 0.3 * 0.25)`. At `d = 0.3` that is
 * `-5/12`, an angle of 114.62 degrees, whose half-angle cosine is
 * `sqrt(7/24)`. A joint limited to a quarter turn cannot fold that far: at 90
 * degrees the chain spans `sqrt(0.3^2 + 0.25^2) = 0.390512`, which is
 * `0.090512` past the target distance.
 *
 * Scenarios:
 *
 * 1. A target whose hinge angle lies inside the range solves on it and reports
 *    a shortfall of zero.
 * 2. A target that needs more fold than the range allows stops at the limit: the
 *    mid joint's rotation is the quarter turn and the shortfall is the span at
 *    the limit less the target distance.
 * 3. Two targets on either side of the one whose hinge angle is the limit itself
 *    give mid rotations that differ by no more than their own angle difference,
 *    so the stop is continuous across the limit.
 * 4. A target past the chain's full length without any range reports the
 *    distance left beyond the straight chain.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Solves an isolated hinge chain with a stated mid joint range and reads the returned mid rotation and shortfall; a stop past the limit, a zero shortfall on an unreached distance or a jump across the limit fails.
 * @evidence contracts/development/testing.md#independent-expectations The law of cosines on segment lengths 0.3 and 0.25 gives the angle for 0.3 (cosine -5/12, half-angle cosine sqrt(7/24)), the span sqrt(0.1525) at a quarter turn, and the straight length 0.55; none is read from the solver.
 * @evidence contracts/development/testing.md#distinguishing-cases Inside the range, past it, either side of the limit, and outside the geometric span with no range; the swivel scoring and rig policy belong to the articulation and reach tests.
 * @evidence contracts/development/testing.md#execution-ownership A discoverable CPU entry owning its local chain and constant scorer; no renderer, native build or host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios with the input and the behavior each pins.
 */
export function test_kinematics_hinged_arm_range(): void {
  const quarter: { min: number; max: number } = {
    min: -Math.PI / 2,
    max: Math.PI / 2,
  };

  // 1. inside the range
  const free: IAutoMovieHingedArticulation = chain(
    { x: 0, y: 0, z: 0.3 },
    { min: -Math.PI, max: Math.PI },
  );
  TestValidator.predicate(
    "a hinge angle inside the range is taken as solved",
    nclose(free.lower.w, Math.sqrt(7 / 24), 1e-9) && free.shortfall === 0,
  );

  // 2. past the range: the quarter turn and its shortfall
  const stopped: IAutoMovieHingedArticulation = chain(
    { x: 0, y: 0, z: 0.3 },
    quarter,
  );
  TestValidator.predicate(
    "a fold past the range stops at the limit",
    nclose(stopped.lower.w, Math.SQRT1_2, 1e-9) &&
      nclose(Math.abs(stopped.lower.y), Math.SQRT1_2, 1e-9),
  );
  TestValidator.predicate(
    "and reports the distance the stopped chain stays past the target",
    nclose(stopped.shortfall, Math.sqrt(0.1525) - 0.3, 1e-9),
  );

  // 3. continuity across the limit: the limit's own distance is sqrt(0.1525)
  const limit: number = Math.sqrt(0.1525);
  const inside: IAutoMovieHingedArticulation = chain(
    { x: 0, y: 0, z: limit + 1e-6 },
    quarter,
  );
  const outside: IAutoMovieHingedArticulation = chain(
    { x: 0, y: 0, z: limit - 1e-6 },
    quarter,
  );
  TestValidator.predicate(
    "the mid rotation is continuous across the limit",
    nclose(inside.lower.w, outside.lower.w, 1e-4) &&
      nclose(inside.lower.y, outside.lower.y, 1e-4) &&
      inside.shortfall === 0 &&
      nclose(outside.shortfall, 1e-6, 1e-9),
  );

  // 4. past the full length, no range
  const far: IAutoMovieHingedArticulation = chain({ x: 0, y: 0, z: 2 });
  TestValidator.predicate(
    "a target past the straight chain reports the distance left",
    nclose(far.lower.w, 1, 1e-9) && nclose(far.shortfall, 1.45, 1e-9),
  );
}
