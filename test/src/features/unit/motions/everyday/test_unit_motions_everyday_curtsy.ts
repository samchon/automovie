import type { IAutoMovieQuaternion } from "@automovie/interface";
import { curtsyCross } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

namespace part_curtsy_cross {
  /** Rounding of a few sums and a frame turn, metres. */
  const ROUNDING: number = 1e-12;

  /**
   * `curtsyCross` crosses a curtsy's rear foot a tenth of a foot's length across
   * the lead ankle, on the lead's side, and 0.15 of it behind the lead heel, and
   * carries the pelvis over the lead foot a quarter of the way from heel to toe,
   * approached from 0.2 of a foot behind.
   *
   * Scenarios, the left foot leading at (0.1, 0.08, 0) and the right at (-0.1,
   * 0.08, 0) in a frame at the origin, both soles from -0.06 to 0.19 m along +Z
   * (a 0.25 m foot):
   *
   * 1. Facing +Z the rear ankle crosses to (0.125, 0.08, -0.2875).
   * 2. The transfer is (0.1, 0, 0.0025) and the approach 0.05 m behind it.
   * 3. Facing -Z (yaw 180) the crossed ankle turns with the frame, to (-0.125, 0.08,
   *    0.2875); the rotation is kept.
   */
  export function run(): void {
    const rotation: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
    const feet: Parameters<typeof curtsyCross>[1] = {
      front: { x: 0.1, y: 0.08, z: 0 },
      rear: { x: -0.1, y: 0.08, z: 0 },
    };
    const soles: Parameters<typeof curtsyCross>[2] = {
      front: [-0.06, 0.05, 0.19],
      rear: [-0.06, 0.05, 0.19],
    };
    const ahead: curtsyCross.ICross = curtsyCross(
      { origin: { x: 0, y: 0, z: 0 }, yaw: 0 },
      feet,
      soles,
      "left",
      rotation,
    );
    TestValidator.predicate(
      "the crossed ankle",
      nclose(ahead.length, 0.25, ROUNDING) &&
        vclose(
          ahead.crossed.ankle,
          { x: 0.125, y: 0.08, z: -0.2875 },
          ROUNDING,
        ),
    );
    TestValidator.predicate(
      "the transfer and its approach",
      vclose(ahead.transfer, { x: 0.1, y: 0, z: 0.0025 }, ROUNDING) &&
        vclose(ahead.approach, { x: 0.1, y: 0, z: 0.0025 - 0.05 }, ROUNDING),
    );
    const behind: curtsyCross.ICross = curtsyCross(
      { origin: { x: 0, y: 0, z: 0 }, yaw: 180 },
      feet,
      soles,
      "left",
      rotation,
    );
    TestValidator.predicate(
      "turned with the frame",
      vclose(
        behind.crossed.ankle,
        { x: -0.125, y: 0.08, z: 0.2875 },
        ROUNDING,
      ) && behind.crossed.rotation === rotation,
    );
  }
}

/**
 * `curtsy`'s unit contract: its crossed foot.
 *
 * Its parts, each documented with its own scenarios:
 *
 * - `curtsy_cross`: `curtsyCross` crosses a curtsy's rear foot a tenth of a
 *   foot's length across the lead ankle, on the lead's side, and 0.15 of it
 *   behind the lead heel, and carries the pelvis over the lead foot a quarter
 *   of the way from heel to toe, approached from 0.2 of a foot behind.
 */
export async function test_unit_motions_everyday_curtsy(): Promise<void> {
  part_curtsy_cross.run();
}
