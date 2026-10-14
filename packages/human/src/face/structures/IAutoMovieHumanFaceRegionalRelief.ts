/**
 * Coarse visible regional skin relief on the connected source. Persistent
 * signed offset is separate from additional fold depth and its independent
 * performed fraction. These are authored millimetres, never ordinal clinical
 * grades or an inferred age-to-tissue conversion.
 *
 * @evidence contracts/common.md#principled-implementation applyHumanFaceRegionalRelief applies restOffsetMm minus foldDepthMm times independent performance along the live source normal on the registered regional material course, preserving source landmarks and lip ports.
 * @evidence contracts/common.md#clear-and-simple-design Signed identity, additional inward depth, performed fraction and support width have distinct fields; only forehead/glabellar courses accept their explicitly required guide dimensions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown courses, nonfinite or unsupported dimensions and active courses without source samples refuse; clinical grades/age never drive this owner, and zero performed fold retains persistent identity rather than implying measured skin.
 * @evidence contracts/common.md#meaningful-documentation Millimetre signs, normal-relative direction, source-guide restrictions and resting omission describe the actual coarse offset convention.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The record performs no guide/chart compilation or skin displacement.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Shape-reference/course derivatives are consumer-owned, not memoized by the schema.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Six caller scalars acquire no host or mesh buffers.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceRegionalRelief {
  /** Persistent outward ridge (+) or inward hollow (-) along the current host normal, finite mm. */
  restOffsetMm?: number;

  /** Extra inward depth along the current host normal at full performance, nonnegative finite mm. */
  foldDepthMm?: number;

  /** Independent performed fold fraction, [0,1]; omission is resting. */
  performance?: number;

  /** Compact three-dimensional support radius, positive finite mm. */
  widthMm: number;

  /** Forehead transverse or glabellar vertical guide length, positive mm. */
  lengthMm?: number;

  /** Forehead guide height above current source glabella, nonnegative mm. */
  elevationMm?: number;
}
