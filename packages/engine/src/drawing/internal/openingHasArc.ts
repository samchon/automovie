import { IAutoMovieOpeningProfile } from "@automovie/interface";

import { AutoMovieEngineOpeningBulgeEpsilon } from "../AutoMovieEngineOpeningBulgeEpsilon";

/*
 * Whether any edge of an opening profile bulges into a visible arc.
 *
 * Uses the same AutoMovieEngineOpeningBulgeEpsilon threshold as
 * `openingArc`, so a profile reported here as arced has a bulge the
 * drafted outline and the measured area also treat as curved, unless that
 * edge's ends coincide. Absent bulges mean every edge is straight.
 * Parameter profile: Opening profile to inspect.
 * Returns: `true` when at least one bulge exceeds the straight-edge threshold.
 */
export const openingHasArc = (
  profile: IAutoMovieOpeningProfile,
): boolean =>
  (profile.bulges ?? []).some(
    (bulge: number): boolean =>
      Math.abs(bulge) > AutoMovieEngineOpeningBulgeEpsilon,
  );
