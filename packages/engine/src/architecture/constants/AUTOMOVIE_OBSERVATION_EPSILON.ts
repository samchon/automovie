/**
 * Slack below which two derived quantities are treated as one.
 *
 * It is read two ways, and both land on the same number for the same reason.
 * As a length it is metres of building, so one micrometre is far below any
 * authored dimension and far above the drift a rotation and a linear solve
 * introduce. As the scalar triple product of three unit normals it is
 * dimensionless, and one micrometre of it is three planes so nearly coplanar
 * that the point they meet at is numerically meaningless.
 *
 * @evidence requirements/review/subject-inspection.md#review-subject-viewpoint-ownership Fixes the slack under which two derived observation stations are one station.
 * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-viewpoint-plan Bounds the numeric tolerance the derivation is deterministic under.
 */
export const AUTOMOVIE_OBSERVATION_EPSILON = 1e-6;
