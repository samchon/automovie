/**
 * Distance, in metres, a containment probe steps off a boundary face.
 *
 * A face plane sits on the surface of the volume it bounds, so a point exactly
 * on it answers containment ambiguously. One millimetre is smaller than any
 * room and larger than the containment epsilon, so the probe lands strictly
 * inside on one side and strictly outside on the other.
 *
 * @evidence requirements/review/subject-inspection.md#review-subject-viewpoint-ownership Fixes how far a probe steps off a face before asking which side a space is on.
 * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-viewpoint-plan Bounds the containment probe used to orient an envelope face.
 */
export const AUTOMOVIE_OBSERVATION_PROBE = 1e-3;
