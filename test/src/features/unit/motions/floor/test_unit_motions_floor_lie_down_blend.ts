import type {
  IAutoMovieMotionHumanLieDown,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";
import { lieDownBlend } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** Rounding of one product and sum per angle, degrees. */
const ROUNDING: number = 1e-12;

/**
 * `lieDownBlend` prepares one linear joint blend from each route key to the
 * next (`prepareHumanShapeBlend`): one fewer blend than keys, the `i`th from
 * key `i` to key `i + 1`.
 *
 * Scenarios:
 *
 * 1. Three keys give two blends.
 * 2. The first blend at a quarter is a quarter of the way from the first key to
 *    the second.
 * 3. The second blend at its ends is the second and the third key.
 */
export function test_unit_motions_floor_lie_down_blend(): void {
  const key = (hips: number): IAutoMovieMotionHumanLieDown.IPose => ({
    pitch: 0,
    roll: 0,
    joints: { hips: [hips, 0, 0] },
  });
  const blends: ((weight: number) => IAutoMovieMotionHumanPosture["joints"])[] =
    lieDownBlend({
      keys: [key(0), key(40), key(100)],
    });
  TestValidator.equals("one blend between each two keys", blends.length, 2);
  TestValidator.predicate(
    "a quarter of the first",
    nclose(blends[0]!(0.25).hips![0], 10, ROUNDING),
  );
  TestValidator.predicate(
    "the second's ends",
    nclose(blends[1]!(0).hips![0], 40, ROUNDING) &&
      nclose(blends[1]!(1).hips![0], 100, ROUNDING),
  );
}
