import type { IAutoMovieMotionHumanPosture } from "@automovie/interface";
import { AquaticPosture } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `AquaticPosture.translate` moves a posture to a new root, its rigid turn's
 * pivot carried by the same displacement.
 *
 * Scenarios:
 *
 * 1. A posture turned about (0, 1, 0) moved from the origin to (2, 0, 1) turns
 *    about (2, 1, 1), by the same turn.
 * 2. A posture with no turn keeps none.
 */
export function test_unit_motions_sport_aquatic_posture_translate(): void {
  const posture: IAutoMovieMotionHumanPosture = {
    root: { x: 0, y: 0, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: {},
    rotation: {
      about: { x: 0, y: 1, z: 0 },
      turn: { x: 0, y: 0, z: 1, w: 0 },
    },
  };
  TestValidator.equals(
    "the carried pivot",
    [
      AquaticPosture.translate(posture, { x: 2, y: 0, z: 1 }),
      AquaticPosture.translate({ ...posture, rotation: undefined }, {
        x: 2,
        y: 0,
        z: 1,
      }).rotation,
    ],
    [
      {
        ...posture,
        root: { x: 2, y: 0, z: 1 },
        rotation: {
          about: { x: 2, y: 1, z: 1 },
          turn: { x: 0, y: 0, z: 1, w: 0 },
        },
      },
      undefined,
    ],
  );
}
