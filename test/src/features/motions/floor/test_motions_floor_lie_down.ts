import type {
  IAutoMovieMotionClockPhase,
  IAutoMovieMotionHumanLieDown,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";
import {
  lieDown
} from "../../../../../packages/motions/src/floor/internal/lieDown";
import {
  lieDownBlend
} from "../../../../../packages/motions/src/floor/internal/lieDownBlend";
import {
  lieDownPhases
} from "../../../../../packages/motions/src/floor/internal/lieDownPhases";
import {
  lieDownRollSide
} from "../../../../../packages/motions/src/floor/internal/lieDownRollSide";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

namespace part_lie_down_blend {
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
  export function verify(): void {
    const key = (hips: number): IAutoMovieMotionHumanLieDown.IPose => ({
      pitch: 0,
      roll: 0,
      joints: { hips: [hips, 0, 0] },
    });
    const blends: ((
      weight: number,
    ) => IAutoMovieMotionHumanPosture["joints"])[] = lieDownBlend({
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
}

namespace part_lie_down_phases {
  /**
   * `lieDownPhases` lays the lie's clock out: `getDown` and each route arrival
   * but the last take `lieDown.PHASE` seconds, the last arrival takes none, and
   * the settled hold takes the authored hold.
   *
   * Scenarios:
   *
   * 1. A three-key route held 2 s has `getDown`, the first two arrivals at `PHASE`
   *    each, the last arrival at 0 and `settled` at 2.
   * 2. A one-key route has `getDown`, its arrival at 0 and the hold.
   */
  export function verify(): void {
    const phase: number = lieDown.PHASE;
    TestValidator.equals(
      "a three-key route",
      lieDownPhases({
        route: [
          ["sit", "seatContact"],
          ["lean", "elbowsDown"],
          ["supine", "supine"],
        ],
        hold: 2,
      }),
      [
        { name: "getDown", seconds: phase },
        { name: "seatContact", seconds: phase },
        { name: "elbowsDown", seconds: phase },
        { name: "supine", seconds: 0 },
        { name: "settled", seconds: 2 },
      ] satisfies IAutoMovieMotionClockPhase[],
    );
    TestValidator.equals(
      "a one-key route",
      lieDownPhases({ route: [["prone", "prone"]], hold: 0.5 }),
      [
        { name: "getDown", seconds: phase },
        { name: "prone", seconds: 0 },
        { name: "settled", seconds: 0.5 },
      ] satisfies IAutoMovieMotionClockPhase[],
    );
  }
}

namespace part_lie_down_roll_side {
  /**
   * `lieDownRollSide` names the side a lateral lie rolls onto, and none for a
   * position that does not roll.
   *
   * Scenarios:
   *
   * 1. `lateralLeft` rolls left and `lateralRight` right.
   * 2. Supine and prone roll onto no side.
   */
  export function verify(): void {
    TestValidator.equals(
      "the lateral positions",
      [
        lieDownRollSide({ position: "lateralLeft" }),
        lieDownRollSide({ position: "lateralRight" }),
      ],
      ["left", "right"],
    );
    TestValidator.equals(
      "no roll",
      [
        lieDownRollSide({ position: "supine" }),
        lieDownRollSide({ position: "prone" }),
      ],
      [undefined, undefined],
    );
  }
}

/**
 * `lieDown`'s unit contract: its phases, roll side, blend, floor seat and arm
 * room.
 *
 * Its parts, each documented with its own scenarios:
 *
 * - `lie_down_blend`: `lieDownBlend` prepares one linear joint blend from each
 *   route key to the next (`prepareHumanShapeBlend`):
 * - `lie_down_phases`: `lieDownPhases` lays the lie's clock out:
 * - `lie_down_roll_side`: `lieDownRollSide` names the side a lateral lie rolls
 *   onto, and none for a position that does not roll.
 */
export async function test_motions_floor_lie_down(): Promise<void> {
  part_lie_down_blend.verify();
  part_lie_down_phases.verify();
  part_lie_down_roll_side.verify();
}
