import { IAutoMovieOpeningProfile } from "@automovie/interface";

import { AUTOMOVIE_OPENING_BULGE_EPSILON } from "../AUTOMOVIE_OPENING_BULGE_EPSILON";

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
 */
export const autoMovieOpeningHasArc = (
  profile: IAutoMovieOpeningProfile,
): boolean =>
  (profile.bulges ?? []).some(
    (bulge: number): boolean =>
      Math.abs(bulge) > AUTOMOVIE_OPENING_BULGE_EPSILON,
  );
