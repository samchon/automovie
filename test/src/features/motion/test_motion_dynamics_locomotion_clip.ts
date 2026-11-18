import { Quaternion, locomoteMotion } from "@automovie/engine";
import type { IAutoMovieMotion, IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createValidMotion } from "../internal/fixtures";
import { nclose } from "../internal/nclose";
import { throwsError } from "../internal/throwsError";
import { vclose } from "../internal/vclose";

/**
 * A locomotion clip closes its last cycle at the requested distance and heading.
 *
 * Scenarios:
 * 1. Translate along a non-unit horizontal direction through a partial stride and a multiple-cycle path.
 *
 * @evidence contracts/development/testing.md#behavioral-verification A locomotion clip closes its last cycle at the requested distance and heading.
 * @evidence contracts/development/testing.md#independent-expectations A one-second cycle at one metre per second rounds 3.49 metres to three cycles. Below half a stride one half-speed cycle lasts twice the requested distance in seconds.
 * @evidence contracts/development/testing.md#distinguishing-cases Invalid direction and speed cannot define travel.
 * @evidence contracts/development/testing.md#execution-ownership Reads the public operation directly in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the quantities observed and their relation.
 */
export function test_motion_dynamics_locomotion_clip(): void {
  const gait: IAutoMovieMotion = { ...createValidMotion(), loop: true };
  const direction: IAutoMovieVector3 = { x: 3, y: 0, z: 4 };
  for (const [distance, seconds] of [
    [0.2, 0.4],
    [0.5, 1],
    [3.49, 3],
  ] as const) {
    const clip = locomoteMotion("walk", gait, distance, 1, direction, true);
    const end = clip.keyframes[clip.keyframes.length - 1]!.pose.root!;
    TestValidator.predicate(
      "whole-cycle timing and exact endpoint",
      nclose(clip.duration, seconds) &&
        vclose(end.translation, { x: 0.6 * distance, y: 0, z: 0.8 * distance }),
    );
    TestValidator.predicate(
      "heading follows normalized travel",
      vclose(Quaternion.rotateVector(end.rotation, { x: 0, y: 0, z: 1 }), {
        x: 0.6,
        y: 0,
        z: 0.8,
      }),
    );
  }
  const admitted = (
    distance: number,
    speed: number,
    heading: IAutoMovieVector3,
  ): IAutoMovieMotion => locomoteMotion("walk", gait, distance, speed, heading);
  TestValidator.predicate(
    "degenerate or nonfinite travel refused",
    throwsError(() => admitted(-1, 1, direction)) &&
      throwsError(() => admitted(1, 0, direction)) &&
      throwsError(() => admitted(1, 1, { x: 0, y: 0, z: 0 })) &&
      throwsError(() => admitted(1, 1, { x: NaN, y: 0, z: 1 })),
  );
}
