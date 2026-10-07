/**
 * Admitted toe phalanx motion relative to the bone each phalanx hangs from,
 * in degrees.
 *
 * Convention, not a clinical range: the source rig carries no toe angle
 * limits, and no primary measurement of ray-by-ray motion has been read for
 * this table yet (an open item of the toe-ray issue). Flexion is positive
 * toward the sole, the clinical sign; the humanoid toes bone carries the
 * source rig's opposite sign (its positive flexion lifts the toes). The
 * proximal interval is the toes bone's existing one (-45 to 70 there) in this
 * sign, 70 degrees of extension and 45 of flexion, so a ray cannot exceed
 * what the common toes bone already admits; the
 * interphalangeal hinges flex only toward the sole; splay exists only at the
 * metatarsophalangeal joint. A proximal phalanx's admitted flexion is its own
 * pose, independent of the toes bone's.
 *
 * @author Samchon
 */
export const HUMAN_BODY_TOE_RANGE = {
  proximal: { flexion: [-70, 45], abduction: [-10, 10] },
  interphalangeal: { flexion: [0, 60] },
} as const;
