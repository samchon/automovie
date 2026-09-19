/**
 * The vertical component above which an envelope face stops being a facade.
 *
 * `Math.SQRT1_2` is the sine of forty-five degrees, so a face tilted past that
 * is more horizontal than vertical.
 *
 * @evidence requirements/review/subject-inspection.md#review-subject-viewpoint-ownership Fixes the angle at which an exposed face changes the observation it owes.
 * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-viewpoint-plan Bounds the aspect partition with one stated constant.
 */
export const AUTOMOVIE_ENVELOPE_FACADE_LIMIT = Math.SQRT1_2;
