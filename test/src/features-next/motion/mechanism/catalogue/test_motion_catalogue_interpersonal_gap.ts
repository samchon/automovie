import type { IAutoMovieMotionHumanEffort } from "@automovie/interface";
import { AutoMovieMotionHumanGait } from "@automovie/motions";
import { HumanEffort } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../../features/internal/throwsError";

/**
 * An approach stops a chest clearance plus the requested gap from the target.
 *
 * Scenarios:
 * 1. Axis-aligned targets to either side give exact mirrored stop points and headings.
 * 2. Coincident positions and nonpositive gaps are refused.
 * 3. Effort factors preserve the neutral identity and change only within their authored domain.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads public stop geometry and effort modifiers.
 * @evidence contracts/development/testing.md#independent-expectations Signed X displacements determine positions and headings by inspection.
 * @evidence contracts/development/testing.md#distinguishing-cases Opposite bearings separate distance from heading.
 * @evidence contracts/development/testing.md#execution-ownership Calls numerical rules without preparing bodies.
 * @evidence contracts/development/common.md#meaningful-documentation States the distance and the refusal boundaries.
 */
export function test_motion_catalogue_interpersonal_gap(): void {
  const start = { x: 0, y: 0, z: 0 };
  const chest = 0.125;
  const gap = AutoMovieMotionHumanGait.HumanProxemics.GAPS.personal;
  TestValidator.equals("personal spacing in metres", gap, 1);
  for (const side of [-1, 1]) {
    const target = { x: side * 3, y: 1, z: 0 };
    const stop = AutoMovieMotionHumanGait.HumanProxemics.stop(
      start,
      target,
      gap,
      chest,
    );
    TestValidator.equals(
      "floor stop and heading",
      [stop.at.x, stop.at.y, stop.at.z, stop.yaw],
      [target.x - side * (gap + chest), 0, 0, side * 90],
    );
  }
  const gaps = AutoMovieMotionHumanGait.HumanProxemics.GAPS;
  const zones = AutoMovieMotionHumanGait.HumanProxemics.ZONES;
  for (const [distance, interval] of [
    [gaps.intimate, zones.intimate],
    [gaps.faceToFace, zones.personal],
    [gaps.social, zones.social],
  ] as const)
    TestValidator.predicate(
      "named spacing lies inside its zone",
      interval[0] < distance && distance < interval[1],
    );
  TestValidator.predicate(
    "coincident floor positions have no bearing",
    throwsError(() =>
      AutoMovieMotionHumanGait.HumanProxemics.stop(
        start,
        { ...start, y: 1 },
        gap,
        chest,
      ),
    ),
  );
  TestValidator.predicate(
    "spacing must be positive",
    throwsError(() =>
      AutoMovieMotionHumanGait.HumanProxemics.gap(0, undefined as never),
    ),
  );
  const neutral = HumanEffort.modifiers();
  TestValidator.predicate(
    "neutral is identity",
    neutral.tempo === 1 &&
      neutral.extent === 1 &&
      neutral.step === 1 &&
      neutral.swing === 1 &&
      neutral.elbow === 0 &&
      neutral.curvature === 0,
  );
  const levels: number[] = [-1, -0.5, 0, 0.5, 1];
  const series = (
    factor: keyof IAutoMovieMotionHumanEffort.IEffort,
    read: (m: IAutoMovieMotionHumanEffort.IModifiers) => number,
  ): number[] =>
    levels.map((v: number): number =>
      read(HumanEffort.modifiers({ [factor]: v })),
    );
  const falling = (xs: number[]): boolean =>
    xs.every((x: number, i: number): boolean => i === 0 || x < xs[i - 1]!);
  const rising = (xs: number[]): boolean =>
    xs.every((x: number, i: number): boolean => i === 0 || x > xs[i - 1]!);
  TestValidator.predicate(
    "sudden shortens",
    falling(series("time", (m) => m.tempo)),
  );
  TestValidator.predicate(
    "bound shrinks extent",
    falling(series("flow", (m) => m.extent)),
  );
  TestValidator.predicate(
    "bound shortens steps",
    falling(series("flow", (m) => m.step)),
  );
  TestValidator.predicate(
    "bound reduces swing",
    falling(series("flow", (m) => m.swing)),
  );
  TestValidator.predicate(
    "bound draws the elbows in",
    falling(series("flow", (m) => m.elbow)),
  );
  TestValidator.predicate(
    "strong grows extent",
    rising(series("weight", (m) => m.extent)),
  );
  TestValidator.predicate(
    "strong grows swing",
    rising(series("weight", (m) => m.swing)),
  );
  const space: number[] = series("space", (m) => m.curvature);
  TestValidator.predicate(
    "direct removes curvature",
    space[0]! > space[1]! &&
      space[1]! > space[2]! &&
      space[2] === 0 &&
      space[4] === 0,
  );
  for (const effort of Object.values(HumanEffort.ACTIONS))
    TestValidator.predicate(
      "basic action in range",
      Object.values(effort).every(
        (v: number | undefined): boolean =>
          v !== undefined && v >= -1 && v <= 1,
      ),
    );
  TestValidator.predicate(
    "factor out of range refused",
    throwsError((): unknown => HumanEffort.modifiers({ flow: 1.5 })),
  );
}
