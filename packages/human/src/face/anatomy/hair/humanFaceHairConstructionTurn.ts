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
const TIGHTEST_RADIUS: number = 0.006;

/**
 * The construction turn, in radians, that one chord of `length` metres may make. The turn limiter and the rooted-stem look-ahead share this owner, so the turn a station may take and the arc a planned turn needs never disagree.
 *
 * @evidence contracts/common.md#principled-implementation Nominal chord metres divide by a shared 0.006-metre construction scale to bound directional turn.
 * @evidence contracts/common.md#clear-and-simple-design The limiter and lookahead use one turn owner so planned arc and station turn agree.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The classification-derived scale is a numerical convention, not a measured lower bound on three-dimensional biological curvature.
 * @evidence contracts/common.md#meaningful-documentation Returned radians concern nominal chords; projection or shortened travel can change realised polyline curvature.
 * @evidence contracts/performance.md#efficient-algorithms One scalar division takes constant work.
 * @evidence contracts/performance.md#reuse-equivalent-work The shared scale eliminates separate limiter and preview constants without retaining mutable inputs.
 * @evidence contracts/performance.md#bound-retention-and-release-resources No state or geometry is allocated and only the scalar result escapes.
 */
export function humanFaceHairConstructionTurn(length: number): number {
  return length / TIGHTEST_RADIUS;
}
