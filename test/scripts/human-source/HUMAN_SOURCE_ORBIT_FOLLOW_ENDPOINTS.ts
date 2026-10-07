/**
 * Endpoints that carry the orbit as a whole and must carry the eye with it.
 *
 * Each of these moves the skin around the eye, the brow and the lashes, but
 * stores no row for the globe or its pivot landmarks, so the eye stays behind
 * while its socket moves. Endpoints that only reshape the lid aperture are
 * absent on purpose: there the globe is meant to stay, and the runtime lid
 * frame seats the margin on it. Which endpoints belong here was read from the
 * source census of moved surfaces; it is an authored reading of each
 * endpoint's intent, not a measured ocular motion.
 */
export const HUMAN_SOURCE_ORBIT_FOLLOW_ENDPOINTS: readonly string[] = [
  "head-source:cervical.cervicalJointSpan:negative",
  "head-source:cervical.cervicalJointSpan:positive",
  "head-source:cranial.occipitalProjection:negative",
  "head-source:cranial.occipitalProjection:positive",
  "macro/muscle-min+weight-min",
  "neck/measure-neck-height-decr",
  "faceAgeStructure.positive",
  "faceAgeStructure.negative",
  "leftEyeHeight.positive",
  "leftEyeHeight.negative",
  "rightEyeHeight.positive",
  "rightEyeHeight.negative",
];
