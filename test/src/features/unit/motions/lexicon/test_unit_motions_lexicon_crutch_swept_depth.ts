import type { crutchHeldLeg } from "@automovie/motions/internal";
import { crutchHeldLegSweptDepth } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** The entry floor and a 0.2 m tread from 1 m ahead. */
const FLIGHT: crutchHeldLeg.IStep[] = [
  { from: -Infinity, height: 0 },
  { from: 1, height: 0.2 },
];

/**
 * `crutchHeldLegSweptDepth` is a swept point's least signed distance from a
 * flight's solid in its climb's plane: each level the region under its height
 * from where it begins to where the next does, searched along the chord by
 * golden section (Kiefer 1953).
 *
 * Scenarios, the entry floor and a 0.2 m tread from 1 m ahead:
 *
 * 1. A point 0.5 m ahead and 0.1 m up, not swept, is 0.1 m over the floor and 0.5
 *    m short of the tread: 0.1.
 * 2. Swept level at that height to 1.5 m ahead it ends 0.1 m into the tread: −0.1.
 * 3. Swept level at 0.5 m up from the start to 2 m ahead it passes 0.3 m over the
 *    tread at its nearest.
 */
export function test_unit_motions_lexicon_crutch_swept_depth(): void {
  TestValidator.predicate(
    "a point",
    nclose(crutchHeldLegSweptDepth(FLIGHT, [0.5, 0.1], [0.5, 0.1]), 0.1, 1e-12),
  );
  TestValidator.predicate(
    "into the tread",
    nclose(
      crutchHeldLegSweptDepth(FLIGHT, [0.5, 0.1], [1.5, 0.1]),
      -0.1,
      1e-12,
    ),
  );
  TestValidator.predicate(
    "over the tread",
    nclose(crutchHeldLegSweptDepth(FLIGHT, [0, 0.5], [2, 0.5]), 0.3, 1e-12),
  );
}
