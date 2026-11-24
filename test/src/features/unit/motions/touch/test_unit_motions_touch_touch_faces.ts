import type { IAutoMovieMotionHumanPosture } from "@automovie/interface";
import { touchFaces } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { resolvedBones } from "../../../internal/resolvedBones";
import { vclose } from "../../../internal/vclose";

/** Rounding of a midpoint, metres. */
const ROUNDING: number = 1e-12;

/**
 * `touchFaces` names the point a two-handed touch turns the trunk toward: the
 * middle of the two regions when it lies aside of the shoulders' midpoint by
 * more than half their span, measured across the heading; none between them or
 * without both shoulders.
 *
 * Scenarios, shoulders at x = 0.2 and x = -0.2 at 1.4 m (half span 0.2):
 *
 * 1. Facing +Z, regions at x = 0.5 and 0.7 meet at x = 0.6, aside by 0.6: the
 *    middle is faced.
 * 2. Regions meeting at x = 0.1, between the shoulders: none.
 * 3. Facing +X (yaw 90), a middle 0.5 m behind along -Z lies 0.5 aside: faced.
 * 4. Without the right shoulder: none.
 */
export function test_unit_motions_touch_touch_faces(): void {
  const posture = (yaw: number): IAutoMovieMotionHumanPosture => ({
    root: { x: 0, y: 1, z: 0 },
    yaw,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: {},
  });
  const shoulders = resolvedBones([
    ["leftUpperArm", { x: 0.2, y: 1.4, z: 0 }],
    ["rightUpperArm", { x: -0.2, y: 1.4, z: 0 }],
  ]);
  TestValidator.predicate(
    "aside",
    vclose(
      touchFaces(
        shoulders,
        posture(0),
        { x: 0.5, y: 1, z: 0.3 },
        { x: 0.7, y: 1, z: 0.3 },
      )!,
      { x: 0.6, y: 1, z: 0.3 },
      ROUNDING,
    ),
  );
  TestValidator.equals(
    "between",
    touchFaces(
      shoulders,
      posture(0),
      { x: 0, y: 1, z: 0.3 },
      { x: 0.2, y: 1, z: 0.3 },
    ),
    undefined,
  );
  TestValidator.predicate(
    "turned",
    touchFaces(
      shoulders,
      posture(90),
      { x: 0, y: 1, z: -0.4 },
      { x: 0, y: 1, z: -0.6 },
    ) !== undefined,
  );
  TestValidator.equals(
    "one shoulder",
    touchFaces(
      resolvedBones([["leftUpperArm", { x: 0.2, y: 1.4, z: 0 }]]),
      posture(0),
      { x: 0.5, y: 1, z: 0.3 },
      { x: 0.7, y: 1, z: 0.3 },
    ),
    undefined,
  );
}
