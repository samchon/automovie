import { IAutoMovieOpeningProfile } from "@automovie/interface";

/** Below this the bulge is a straight edge, not an arc anybody can see. */
const BULGE_EPSILON = 1e-12;

/**
 * Whether any edge of a profile actually bulges.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Detects when an opening drawing contains faceted arc linework that must be disclosed as an explicit drawing gap.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Classifies a profile as curved exactly when any edge carries a bulge outside the numerical zero tolerance.
 */
export const autoMovieOpeningHasArc = (
  profile: IAutoMovieOpeningProfile,
): boolean =>
  (profile.bulges ?? []).some((bulge) => Math.abs(bulge) > BULGE_EPSILON);
