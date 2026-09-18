/**
 * Fractions, toward the interior centre, an interior station is nudged along.
 *
 * A corner station wants to stand as near its corner as the room admits, and a
 * threshold station as near its opening. Neither can stand on the boundary
 * itself, and how far in it must move depends on the wall thickness, the
 * chamfer, and whatever the room's own cells actually say. Walking a fixed
 * ladder toward the interior centre keeps that deterministic: two callers
 * asking for the same station receive the same point, and a station the ladder
 * cannot place is reported unplaced rather than dropped.
 *
 * @evidence requirements/review/subject-inspection.md#review-subject-viewpoint-ownership Keeps an interior station inside its own space without a caller-supplied inset.
 * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-viewpoint-plan Fixes the deterministic ladder every interior station is placed by.
 */
export const AUTOMOVIE_OBSERVATION_INSET_LADDER: readonly number[] = [
  0.05, 0.1, 0.2, 0.35, 0.5,
];
