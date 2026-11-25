import { Quaternion, locomoteMotion } from "@automovie/engine";
import type { IAutoMovieMotion, IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createValidMotion } from "../../../internal/fixtures";
import { nclose } from "../../../internal/nclose";
import { throwsError } from "../../../internal/throwsError";
import { vclose } from "../../../internal/vclose";

/** The travel direction: (3, 0, 4), normalised (0.6, 0, 0.8). */
const DIRECTION: IAutoMovieVector3 = { x: 3, y: 0, z: 4 };

/**
 * `locomoteMotion` lays a looping gait along a travel: whole gait cycles at the
 * given speed, the last one closed at the travel's exact end, the root heading
 * along the normalised travel when asked.
 *
 * The gait is the shared valid one-second looping fixture
 * (`createValidMotion`).
 *
 * Scenarios, at 1 m/s along (3, 0, 4):
 *
 * 1. Over 0.2, 0.5 and 3.49 m the clip lasts 0.4, 1 and 3 s, whole cycles of at
 *    most the gait's second, and ends at 0.6 d, 0, 0.8 d, heading along (0.6,
 *    0, 0.8).
 * 2. Without facing the travel the root keeps its rest rotation.
 * 3. A distance, speed or gait duration that is not positive, or a zero direction,
 *    is refused.
 */
export function test_unit_engine_motion_locomote_motion(): void {
  const gait: IAutoMovieMotion = { ...createValidMotion(), loop: true };

  // 1. Whole cycles to the exact end.
  const cases: readonly (readonly [number, number])[] = [
    [0.2, 0.4],
    [0.5, 1],
    [3.49, 3],
  ];
  TestValidator.predicate(
    "whole cycles closed at the travel's end, heading along it",
    cases.every(([distance, seconds]: readonly [number, number]): boolean => {
      const clip: IAutoMovieMotion = locomoteMotion(
        "walk",
        gait,
        distance,
        1,
        DIRECTION,
        true,
      );
      const end: NonNullable<
        IAutoMovieMotion["keyframes"][number]["pose"]["root"]
      > = clip.keyframes.at(-1)!.pose.root!;
      return (
        nclose(clip.duration, seconds) &&
        nclose(clip.gaitCycle!.period, Math.min(seconds, 1)) &&
        vclose(end.translation, {
          x: 0.6 * distance,
          y: 0,
          z: 0.8 * distance,
        }) &&
        vclose(Quaternion.rotateVector(end.rotation, { x: 0, y: 0, z: 1 }), {
          x: 0.6,
          y: 0,
          z: 0.8,
        })
      );
    }),
  );

  // 2. Not facing the travel.
  TestValidator.equals(
    "the rest rotation without facing",
    locomoteMotion("walk", gait, 1, 1, DIRECTION).keyframes.at(-1)!.pose.root!
      .rotation,
    { x: 0, y: 0, z: 0, w: 1 },
  );

  // 3. Refusals.
  const walk = (
    distance: number,
    speed: number,
    direction: IAutoMovieVector3,
  ): IAutoMovieMotion =>
    locomoteMotion("walk", gait, distance, speed, direction);
  TestValidator.predicate(
    "non-positive sizes and a zero direction are refused",
    [0, -1].every(
      (value: number): boolean =>
        throwsError((): IAutoMovieMotion => walk(value, 1, DIRECTION)) &&
        throwsError((): IAutoMovieMotion => walk(1, value, DIRECTION)) &&
        throwsError(
          (): IAutoMovieMotion =>
            locomoteMotion(
              "walk",
              { ...gait, duration: value },
              1,
              1,
              DIRECTION,
            ),
        ),
    ) && throwsError((): IAutoMovieMotion => walk(1, 1, { x: 0, y: 0, z: 0 })),
  );
}
