import { IAutoMovieOpeningProfile } from "@automovie/interface";

import { AUTOMOVIE_OPENING_BULGE_EPSILON } from "./constants/AUTOMOVIE_OPENING_BULGE_EPSILON";

/**
 * Whether any edge of an opening profile bulges into a visible arc.
 *
 * Uses the same {@link AUTOMOVIE_OPENING_BULGE_EPSILON} threshold as
 * `autoMovieOpeningArc`, so a profile reported here as arced has a bulge the
 * drafted outline and the measured area also treat as curved, unless that
 * edge's ends coincide. Absent bulges mean every edge is straight.
 *
 * @param profile Opening profile to inspect.
 * @returns `true` when at least one bulge exceeds the straight-edge threshold.
 *
 * @evidence contracts/common.md#principled-implementation A magnitude test of each bulge against the shared straight-edge threshold, which is the same rule `autoMovieOpeningArc` uses to decide whether an edge has a circle.
 * @evidence contracts/common.md#clear-and-simple-design One predicate the drafter reads to decide whether a sheet owes the curved-linework gap, sharing its threshold constant with the arc conversion.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No profile is special-cased; the threshold is a named constant of the bulge contract rather than a value tuned to a fixture.
 * @evidence contracts/common.md#meaningful-documentation The comment states the threshold, its agreement with the arc conversion and the one case, coincident ends, where they differ, and what absent bulges mean.
 * @evidence contracts/performance.md#efficient-algorithms One short-circuiting pass over the bulges, linear in the edge count at worst.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure predicate evaluated once per drawn opening; nothing equivalent repeats.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Allocates and retains nothing beyond an empty array for an absent bulge list.
 * @author Samchon
 */
export const autoMovieOpeningHasArc = (
  profile: IAutoMovieOpeningProfile,
): boolean =>
  (profile.bulges ?? []).some(
    (bulge: number): boolean => Math.abs(bulge) > AUTOMOVIE_OPENING_BULGE_EPSILON,
  );
