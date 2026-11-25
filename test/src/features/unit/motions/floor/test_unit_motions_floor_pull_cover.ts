import type { IAutoMovieVector3 } from "@automovie/interface";
import { pullCoverWay } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../../internal/vclose";

namespace part_pull_cover_way {
  /** Rounding of a linear interpolation, metres. */
  const ROUNDING: number = 1e-12;

  /**
   * `pullCoverWay` is the point a share of the way along a polyline, measured
   * along its pieces and clamped to the way.
   *
   * Scenarios, the way (0, 0, 0), (1, 0, 0), (1, 2, 0), 3 m long:
   *
   * 1. Shares 0, 1/3, 2/3 and 1 are the start, the corner, half way up the second
   *    piece and the end.
   * 2. Shares below 0 and above 1 hold the ends.
   */
  export function verify(): void {
    const p = (x: number, y: number): IAutoMovieVector3 => ({ x, y, z: 0 });
    const way: IAutoMovieVector3[] = [p(0, 0), p(1, 0), p(1, 2)];
    TestValidator.predicate(
      "along the way",
      vclose(pullCoverWay(way, 0), p(0, 0), ROUNDING) &&
        vclose(pullCoverWay(way, 1 / 3), p(1, 0), ROUNDING) &&
        vclose(pullCoverWay(way, 2 / 3), p(1, 1), ROUNDING) &&
        vclose(pullCoverWay(way, 1), p(1, 2), ROUNDING),
    );
    TestValidator.predicate(
      "held at the ends",
      vclose(pullCoverWay(way, -1), p(0, 0), ROUNDING) &&
        vclose(pullCoverWay(way, 2), p(1, 2), ROUNDING),
    );
  }
}

/**
 * `pullCover`'s unit contract: its way.
 *
 * Its parts, each documented with its own scenarios:
 *
 * - `pull_cover_way`: `pullCoverWay` is the point a share of the way along a
 *   polyline, measured along its pieces and clamped to the way.
 */
export async function test_unit_motions_floor_pull_cover(): Promise<void> {
  part_pull_cover_way.verify();
}
