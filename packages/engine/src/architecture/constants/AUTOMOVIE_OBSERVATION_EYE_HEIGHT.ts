/**
 * Standing eye height, in metres, an interior observation is taken from.
 *
 * A room is judged from the height its user reads it at, and a camera dropped
 * to the floor or lifted to the slab reports proportions nobody experiences. A
 * room shorter than twice this height is observed from its own mid-height
 * instead, so a crawl space is not observed from inside its ceiling.
 *
 * @evidence requirements/review/subject-inspection.md#review-subject-viewpoint-ownership Places every interior station at the height its declared user reads the space from.
 * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-viewpoint-plan Fixes the deterministic interior eye height shared by every caller.
 */
export const AUTOMOVIE_OBSERVATION_EYE_HEIGHT = 1.6;
