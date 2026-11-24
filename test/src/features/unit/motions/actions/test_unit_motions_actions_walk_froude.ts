import { AutoMovieGravity } from "@automovie/engine";
import { walk, walkRoot } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** Rounding of a square root, m/s. */
const ROUNDING: number = 1e-12;

/**
 * `walk.FROUDE` is each pace's Froude number, the speed `sqrt(Fr g l)` at the
 * reference hip `l` (`walkRoot.REFERENCE_HIP`): the slow and fast outdoor paces
 * of healthy adults, 0.82 and 1.72 m/s (Murtagh et al. 2021), and the
 * metabolic optimum 0.25 for the normal pace (PMID 21653821).
 *
 * Scenarios:
 *
 * 1. The slow pace walks 0.82 m/s at the reference hip.
 * 2. The fast pace walks 1.72 m/s there.
 * 3. The normal pace is Froude 0.25, between them.
 */
export function test_unit_motions_actions_walk_froude(): void {
  const speed: (froude: number) => number = (froude: number): number =>
    Math.sqrt(froude * AutoMovieGravity.STANDARD * walkRoot.REFERENCE_HIP);
  TestValidator.predicate("slow", nclose(speed(walk.FROUDE.slow), 0.82, ROUNDING));
  TestValidator.predicate("fast", nclose(speed(walk.FROUDE.fast), 1.72, ROUNDING));
  TestValidator.predicate(
    "normal",
    walk.FROUDE.normal === 0.25 &&
      walk.FROUDE.slow < walk.FROUDE.normal &&
      walk.FROUDE.normal < walk.FROUDE.fast,
  );
}
