import type { IAutoMovieVector3 } from "@automovie/interface";
import { restForearm } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../../internal/vclose";

/** Rounding of a square root and a normalization. */
const ROUNDING: number = 1e-12;

/**
 * `restForearm` lays a resting arm's forearm by the two-link closed form:
 * `across` is a vector's unit component across a normal, and `direction` puts
 * the elbow on the circle the upper arm `u` and forearm `l` allow about the
 * shoulder-to-wrist line `d`, `(u^2 - l^2 + d^2) / 2d` along it and the rest
 * of `u` across it toward the bend hint, and points from it to the wrist.
 *
 * Scenarios, a 0.3 m upper arm and a 0.25 m forearm from a shoulder at the
 * origin:
 *
 * 1. `across` of (1, 1, 0) about +X is +Y.
 * 2. To a wrist at (0.4, 0, 0) with the hint ahead along +Z, the elbow lies at
 *    (0.234375, 0, sqrt(0.09 - 0.234375^2)) and the forearm points from it to
 *    the wrist, its length the forearm's.
 * 3. A wrist beyond the arm's reach straightens the arm along the line.
 */
export function test_unit_motions_everyday_rest_forearm(): void {
  const p: (x: number, y: number, z: number) => IAutoMovieVector3 = (
    x: number,
    y: number,
    z: number,
  ): IAutoMovieVector3 => ({ x, y, z });
  TestValidator.predicate(
    "across",
    vclose(restForearm.across(p(1, 0, 0), p(1, 1, 0)), p(0, 1, 0), ROUNDING),
  );
  const along: number = (0.09 - 0.0625 + 0.16) / 0.8;
  const off: number = Math.sqrt(0.09 - along * along);
  TestValidator.predicate(
    "the bent forearm",
    vclose(
      restForearm.direction(0.3, 0.25, p(0, 0, 0), p(0.4, 0, 0), p(0, 0, 1)),
      p((0.4 - along) / 0.25, 0, -off / 0.25),
      ROUNDING,
    ),
  );
  TestValidator.predicate(
    "straight beyond reach",
    vclose(
      restForearm.direction(0.3, 0.25, p(0, 0, 0), p(1, 0, 0), p(0, 0, 1)),
      p(1, 0, 0),
      1e-6,
    ),
  );
}
