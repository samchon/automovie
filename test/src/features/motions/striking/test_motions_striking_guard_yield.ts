import type { IAutoMovieVector3 } from "@automovie/interface";
import { StrikingGuardYield } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../internal/vclose";

/**
 * The clearance's reported depth resolves to a tenth of a millimetre, shared
 * equally between two bodies. Allow binary64 rounding for a signed product.
 */
const HALF_CLEARANCE_METRES: number = 0.0001 / 2 + 4 * Number.EPSILON;

/**
 * Reciprocal clearance splits a separating move equally between two animated
 * bodies. The first moves along the negative floor axis. A linear signed gap
 * yields an independent analytic contact boundary.
 *
 * Scenarios:
 *
 * 1. Already clear or exactly touching bodies retain their position.
 * 2. A gap of `(step - 0.3) / 3` requires twice expanding the initial 0.1 m
 *    bracket. The first body moves 0.15 m opposite a diagonal unit axis.
 */
export function test_motions_striking_guard_yield(): void {
  const axis: IAutoMovieVector3 = { x: 0.6, y: 0, z: 0.8 };
  TestValidator.predicate(
    "a clear pair stays put",
    StrikingGuardYield.separate(axis, 1, (): number => 0.1) === null &&
      StrikingGuardYield.separate(axis, 1, (): number => 0) === null,
  );
  const move: IAutoMovieVector3 | null = StrikingGuardYield.separate(
    axis,
    1,
    (distance: number): number => (distance - 0.3) / 3,
  );
  TestValidator.predicate(
    "the first body gets half the separating move",
    move !== null && vclose(move, { x: -0.09, y: 0, z: -0.12 }, HALF_CLEARANCE_METRES),
  );
}
