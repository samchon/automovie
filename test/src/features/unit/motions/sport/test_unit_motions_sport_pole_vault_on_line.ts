import type { IAutoMovieVector3 } from "@automovie/interface";
import { poleVaultOnLine } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../../internal/vclose";

/**
 * `poleVaultOnLine` finds where a sphere about a grip meets a segment: the
 * farther along of the two roots of `|from + s slide - grip|² = length²`,
 * clamped to the segment, none when the sphere misses the line.
 *
 * The segment runs from the origin 4 m along +X; the grip stands 1 m above x =
 * 2.
 *
 * Scenarios:
 *
 * 1. A sphere of `sqrt(2)` m meets the line at x = 1 and 3: the farther, (3, 0,
 *    0).
 * 2. A sphere reaching past the segment's end is clamped to (4, 0, 0).
 * 3. A sphere of 0.5 m misses the line; a segment of no length has no point.
 */
export function test_unit_motions_sport_pole_vault_on_line(): void {
  const from: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const slide: IAutoMovieVector3 = { x: 4, y: 0, z: 0 };
  const grip: IAutoMovieVector3 = { x: 2, y: 1, z: 0 };
  TestValidator.predicate(
    "the farther crossing, clamped",
    vclose(poleVaultOnLine(from, slide, grip, Math.SQRT2)!, { x: 3, y: 0, z: 0 }, 1e-12) &&
      vclose(poleVaultOnLine(from, slide, grip, 5)!, { x: 4, y: 0, z: 0 }, 1e-12),
  );
  TestValidator.equals(
    "missed, and degenerate",
    [
      poleVaultOnLine(from, slide, grip, 0.5),
      poleVaultOnLine(from, { x: 0, y: 0, z: 0 }, grip, 2),
    ],
    [undefined, undefined],
  );
}
