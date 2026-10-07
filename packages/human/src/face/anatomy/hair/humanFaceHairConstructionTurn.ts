/**
 * Construction scale of the hair walk: a chord of length h may turn by
 * h / 0.006 radians, so turning by θ needs at least 0.006 · θ metres of arc.
 * This keeps requested tangents away from antiparallel; contact projection and
 * shortened steps may give the realised polyline a different local curvature.
 *
 * Loussouarn et al. (2007, Int J Dermatol 46 Suppl.1, 2-6) classify washed,
 * dried 6 cm hairs by two-dimensional curve diameter and other descriptors.
 * Their 1.2 cm diameter cutoff is a classification boundary, not a lower bound
 * on three-dimensional local curvature radius. This construction scale is
 * therefore a numerical convention and carries no biological-radius claim.
 */
const TIGHTEST_RADIUS = 0.006;

/**
 * The construction turn, in radians, that one chord of `length` metres may
 * make. The turn limiter and the rooted-stem look-ahead share this owner, so
 * the turn a station may take and the arc a planned turn needs never disagree.
 *
 * @evidence contracts/common.md#principled-implementation Turn is arc length over the construction radius, the curvature relation of a circular arc.
 * @evidence contracts/common.md#clear-and-simple-design One owner of the construction curvature for the limiter and the look-ahead.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts One stated construction constant; no subject or style changes it.
 * @evidence contracts/common.md#meaningful-documentation States the relation, the constant's status and its consumers.
 * @evidence contracts/modeling.md#spatial-conventions Length and radius are metres; the turn is radians.
 * @evidenceExclude contracts/modeling.md#parameter-channels Defines no author channel.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Builds no surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation Displays nothing.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The constant is a numerical convention, as stated, not a measured radius.
 * @evidenceExclude contracts/anatomy.md#permitted-range Bounds a numerical turn, not an anatomical quantity.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No caller input shapes a human form through it.
 */
export function humanFaceHairConstructionTurn(length: number): number {
  return length / TIGHTEST_RADIUS;
}
