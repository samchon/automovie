import { AutoMovieEngineMotionSampling, AutoMovieEngineMotionTrajectory } from "@automovie/engine";
import type {
  IAutoMovieSuperposeMinimumJerk,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";

/** Rounding of a quintic's evaluation, units of the displacement. */
const ROUNDING: number = 1e-12;

/** The half step a seam's continuity is read across, seconds. */
const H: number = 1e-6;

/**
 * `minimumJerk` is Flash and Hogan's (1985) normalised rest-to-rest movement,
 * `s(u) = u³ (10 − 15 u + 6 u²)` with rate `30 u² (1 − u)²`, held at its ends;
 * `superposeMinimumJerk` sums such units, each its own start, duration and
 * displacement (Flash and Henis 1991), so overlapping units add.
 *
 * Scenarios:
 *
 * 1. The share and rate at −1, 0, ¼, ½, ¾, 1 and 2 are the closed form, the time
 *    clamped.
 * 2. An empty unit list returns a fresh copy of the origin.
 * 3. A 2 m unit along +X over 0 to 1 s and a −1 m unit along Y over 1 to 2 s: at
 *    0.5 s x = 4 moving at 15/8 · 2 = 3.75; at 1 s x = 5 at rest; from 2 s y =
 *    1.
 * 4. The Y unit started at 0.25 s overlaps the X unit: at 0.5 s y = 2 − s(¼) = 2 −
 *    53/512, and across 0.25, 1 and 1.25 s the position, velocity and
 *    acceleration carry, each changing by no more than its next derivative's
 *    peak over the step.
 * 5. A unit of no duration is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names clamped rest-to-rest easing, fresh output with no units, consecutive and overlapping units, and zero duration refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the scalar basis directly and the trajectory superposition with typed displacement units. Values and derivatives are checked at interior times and across the start and end of concurrent units.
 * @evidence contracts/development/testing.md#independent-expectations The polynomial u³(10 - 15u + 6u²) and its derivatives give the selected shares and rates. The overlapping Y unit contributes -53/512 m at 0.5 s. Near each seam, the next derivative's peak bounds the change in position, velocity, and acceleration.
 */
export function test_engine_motion_minimum_jerk(): void {
  // 1. The normalised unit.
  TestValidator.predicate(
    "the closed form, clamped",
    [-1, 0, 0.25, 0.5, 0.75, 1, 2].every((t: number): boolean => {
      const u: number = Math.max(0, Math.min(1, t));
      return (
        nclose(
          AutoMovieEngineMotionSampling.minimumJerkShare(t),
          u ** 3 * (10 - 15 * u + 6 * u * u),
          ROUNDING,
        ) && nclose(AutoMovieEngineMotionSampling.minimumJerkRate(t), 30 * u * u * (1 - u) ** 2, ROUNDING)
      );
    }),
  );

  // 2. No unit.
  const origin: IAutoMovieVector3 = { x: 3, y: 2, z: 1 };
  const empty: IAutoMovieVector3 = AutoMovieEngineMotionTrajectory.superposeMinimumJerkPosition(origin, [], 0);
  TestValidator.predicate(
    "no unit leaves the origin",
    empty !== origin && empty.x === 3 && empty.y === 2 && empty.z === 1,
  );

  // 3. Two units in turn.
  const units: IAutoMovieSuperposeMinimumJerk.IUnit[] = [
    { start: 0, duration: 1, displacement: { x: 2, y: 0, z: 0 } },
    { start: 1, duration: 1, displacement: { x: 0, y: -1, z: 0 } },
  ];
  const at = (t: number): IAutoMovieSuperposeMinimumJerk.IState =>
    AutoMovieEngineMotionTrajectory.superposeMinimumJerk(origin, units, t);
  TestValidator.predicate(
    "two units in turn",
    nclose(at(0.5).position.x, 4, ROUNDING) &&
      nclose(at(0.5).velocity.x, 3.75, ROUNDING) &&
      nclose(at(1).position.x, 5, ROUNDING) &&
      nclose(at(1).velocity.x, 0, ROUNDING) &&
      nclose(at(2).position.y, 1, ROUNDING) &&
      nclose(at(1e9).position.y, 1, ROUNDING),
  );

  // 4. Overlapping units.
  const overlapping: IAutoMovieSuperposeMinimumJerk.IUnit[] = [
    units[0]!,
    { ...units[1]!, start: 0.25 },
  ];
  const point: IAutoMovieVector3 = AutoMovieEngineMotionTrajectory.superposeMinimumJerkPosition(
    origin,
    overlapping,
    0.5,
  );
  TestValidator.predicate(
    "overlapping units add and carry across their seams",
    nclose(point.x, 4, ROUNDING) &&
      nclose(point.y, 2 - 53 / 512, ROUNDING) &&
      [0.25, 1, 1.25].every((seam: number): boolean => {
        const left: IAutoMovieSuperposeMinimumJerk.IState =
          AutoMovieEngineMotionTrajectory.superposeMinimumJerk(origin, overlapping, seam - H);
        const right: IAutoMovieSuperposeMinimumJerk.IState =
          AutoMovieEngineMotionTrajectory.superposeMinimumJerk(origin, overlapping, seam + H);
        return (["x", "y"] satisfies (keyof IAutoMovieVector3)[]).every(
          (axis: keyof IAutoMovieVector3): boolean =>
            Math.abs(left.position[axis] - right.position[axis]) <= 2 * H * 4 &&
            Math.abs(left.velocity[axis] - right.velocity[axis]) <=
              2 * H * 60 &&
            Math.abs(left.acceleration[axis] - right.acceleration[axis]) <=
              2 * H * 2000,
        );
      }),
  );

  // 5. No duration.
  TestValidator.predicate(
    "a unit of no duration is refused",
    throwsError(
      (): IAutoMovieSuperposeMinimumJerk.IState =>
        AutoMovieEngineMotionTrajectory.superposeMinimumJerk(origin, [{ ...units[1]!, duration: 0 }], 1),
    ),
  );
}
