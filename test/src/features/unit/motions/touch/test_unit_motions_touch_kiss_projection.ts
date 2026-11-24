import type {
  IAutoMovieMotionHumanLean,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";
import { kissProjection } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** Rounding of a few trigonometric identities, degrees. */
const ROUNDING: number = 1e-9;

/**
 * `kissProjection` aims the hip-to-mouth vector at a skin point by a rigid
 * turn about the hip: a roll sets its sideways part, then a pitch its forward
 * part, each the inverse sine of the goal's component over the radius it turns
 * on, less the angle the mouth already makes; none beyond that radius.
 *
 * Scenarios, an upright entry facing +Z with the hip at (0, 1, 0):
 *
 * 1. The mouth 0.6 m above and 0.1 m ahead, aimed at itself: no turn.
 * 2. The same mouth aimed 20 degrees further forward on its own circle about
 *    the hip's left axis: a 20 degree pitch, no roll.
 * 3. A mouth straight above at 0.6 m aimed 15 degrees toward -X: a 15 degree
 *    roll, no pitch.
 * 4. A point 1 m aside, beyond the 0.6 m radius: none.
 */
export function test_unit_motions_touch_kiss_projection(): void {
  const entry: IAutoMovieMotionHumanPosture = {
    root: { x: 0, y: 1, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: {},
  };
  const hip: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  const ahead: IAutoMovieVector3 = { x: 0, y: 1.6, z: 0.1 };
  const still: IAutoMovieMotionHumanLean.IAngles | null = kissProjection(
    entry,
    hip,
    ahead,
    ahead,
  );
  TestValidator.predicate(
    "aimed at itself",
    still !== null &&
      nclose(still.pitch, 0, ROUNDING) &&
      nclose(still.roll, 0, ROUNDING),
  );
  const radius: number = Math.hypot(0.6, 0.1);
  const angle: number = Math.atan2(0.1, 0.6) + (20 * Math.PI) / 180;
  const pitched: IAutoMovieMotionHumanLean.IAngles | null = kissProjection(
    entry,
    hip,
    ahead,
    { x: 0, y: 1 + radius * Math.cos(angle), z: radius * Math.sin(angle) },
  );
  TestValidator.predicate(
    "forward",
    pitched !== null &&
      nclose(pitched.pitch, 20, ROUNDING) &&
      nclose(pitched.roll, 0, ROUNDING),
  );
  const tilt: number = (15 * Math.PI) / 180;
  const rolled: IAutoMovieMotionHumanLean.IAngles | null = kissProjection(
    entry,
    hip,
    { x: 0, y: 1.6, z: 0 },
    { x: -0.6 * Math.sin(tilt), y: 1 + 0.6 * Math.cos(tilt), z: 0 },
  );
  TestValidator.predicate(
    "sideways",
    rolled !== null &&
      nclose(rolled.roll, 15, ROUNDING) &&
      nclose(rolled.pitch, 0, ROUNDING),
  );
  TestValidator.equals(
    "beyond reach",
    kissProjection(entry, hip, ahead, { x: 1, y: 1, z: 0 }),
    null,
  );
}
