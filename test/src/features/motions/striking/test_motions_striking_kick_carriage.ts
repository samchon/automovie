import { KickCarriage } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** The cubic factor in a binary64 quintic at these exact dyadic shares rounds within 16 ulps. */
const MOTION_ROUNDING: number = 16 * Number.EPSILON;

/**
 * The animated carriage's step, body turn and translation have independent
 * tracks. For the quintic, a quarter share gives `53/512` and its midpoint
 * gives `1/2` by direct evaluation.
 *
 * Scenarios:
 *
 * 1. Between preparation at 1 s and the chamber at 2 s the step grows alone
 *    on its own clock. At 1.25 s its share is `53/512`.
 * 2. From 2 to 4 s the pelvis drive grows while the body holds its full turn.
 *    Both recover over 4 to 6 s, but the support step remains.
 * 3. A reversed turn clock can recover before the separate step clock has
 *    reached the step's end. An absent drive remains zero.
 */
export function test_motions_striking_kick_carriage(): void {
  const timing = { prep: 1, chamber: 2, impact: 4, duration: 6 };
  const travel = { step: 0.25, drive: 0.125 };
  const before: KickCarriage.IMotion = KickCarriage.motion(timing, travel, 1, 0);
  TestValidator.equals("nothing has begun", before, {
    weight: 0,
    stepped: 0,
    driven: 0,
  });

  const opening: KickCarriage.IMotion = KickCarriage.motion(timing, travel, 1.25, 1);
  TestValidator.predicate(
    "independent opening clocks",
    opening.weight === 0.5 &&
      nclose(opening.stepped, 53 / 2048, MOTION_ROUNDING) &&
      opening.driven === 0,
  );
  const applied: KickCarriage.IMotion = KickCarriage.motion(timing, travel, 2, 3);
  TestValidator.equals("drive grows after the step", applied, {
    weight: 1,
    stepped: 0.25,
    driven: 0.0625,
  });
  const recoil: KickCarriage.IMotion = KickCarriage.motion(timing, travel, 1.5, 5);
  TestValidator.equals("recovery uses the turn's clock", recoil, {
    weight: 0.5,
    stepped: 0.125,
    driven: 0.0625,
  });
  TestValidator.equals("only the step remains", KickCarriage.motion(timing, travel, 6, 6), {
    weight: 0,
    stepped: 0.25,
    driven: 0,
  });
  TestValidator.equals("a zero drive stays zero", KickCarriage.motion(timing, { ...travel, drive: 0 }, 3, 3).driven, 0);
}
