import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { shiftStandingWeightSteps } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `shiftStandingWeightSteps` checks and times a standing weight shift: `plants`
 * holds a solved foot within 3 mm and half a degree of its entry, and
 * `instants` reaches the shift at the transfer's end and, returning, releases
 * it after the hold and returns it at the end.
 *
 * Scenarios, an entry ankle at (0.1, 0.08, 0) facing +Z:
 *
 * 1. The foot as entered keeps its plant; 2 mm off it still does, 4 mm off it does
 *    not.
 * 2. Turned 0.4 degrees it keeps its plant; turned 0.6 it does not.
 * 3. A held shift of 0.8 s is `shifted` at 0.8 s; one that holds 0.5 s and returns
 *    over 0.6 s releases at 1.3 s and returns at 1.9 s.
 */
export async function test_motions_everyday_shift_standing_weight(): Promise<void> {
  const ankle: IAutoMovieVector3 = { x: 0.1, y: 0.08, z: 0 };
  const facing: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
  const entry: Parameters<typeof shiftStandingWeightSteps.plants>[1] = {
    ankle,
    rotation: facing,
  };
  const at = (
    dx: number,
    turn: number,
  ): Parameters<typeof shiftStandingWeightSteps.plants>[0] => ({
    worldPosition: { ...ankle, x: ankle.x + dx },
    worldRotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, turn),
  });
  TestValidator.equals(
    "the ankle's drift",
    [
      shiftStandingWeightSteps.plants(at(0, 0), entry),
      shiftStandingWeightSteps.plants(at(0.002, 0), entry),
      shiftStandingWeightSteps.plants(at(0.004, 0), entry),
    ],
    [true, true, false],
  );
  TestValidator.equals(
    "the foot's turn",
    [
      shiftStandingWeightSteps.plants(at(0, 0.4), entry),
      shiftStandingWeightSteps.plants(at(0, 0.6), entry),
    ],
    [true, false],
  );
  TestValidator.equals(
    "the instants",
    [
      shiftStandingWeightSteps.instants(0.8, 0),
      shiftStandingWeightSteps.instants(0.8, 0.5, 0.6),
    ],
    [
      [{ name: "shifted", seconds: 0.8 }],
      [
        { name: "shifted", seconds: 0.8 },
        { name: "release", seconds: 1.3 },
        { name: "returned", seconds: 0.8 + 0.5 + 0.6 },
      ],
    ],
  );
}
