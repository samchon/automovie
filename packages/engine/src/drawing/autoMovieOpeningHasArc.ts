import { IAutoMovieOpeningProfile } from "@automovie/interface";

/** Below this the bulge is a straight edge, not an arc anybody can see. */
const BULGE_EPSILON = 1e-12;

/** Whether any edge of a profile actually bulges. */
export const autoMovieOpeningHasArc = (
  profile: IAutoMovieOpeningProfile,
): boolean =>
  (profile.bulges ?? []).some((bulge) => Math.abs(bulge) > BULGE_EPSILON);
