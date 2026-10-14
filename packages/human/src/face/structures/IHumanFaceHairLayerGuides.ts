/**
 * Numerical guide hierarchy of a connected hair population.
 * Guides and interpolated locks retain native root identities. Same-side guide
 * selection falls back to all guides when the gated pool is empty; interpolation
 * alone establishes neither part-side separation nor inherited contact clearance.
 *
 * @evidence contracts/common.md#principled-implementation Deterministic root-sequence selection integrates the requested guide fraction; nearest-guide displacement interpolation at equal arc fractions supplies other roots before their own contact placement.
 * @evidence contracts/common.md#clear-and-simple-design Fraction chooses integrated guides, neighbours bounds the local blend and clump controls optional tip attraction; the builder owns sampling and the interpolator owns guide selection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Selecting no guide refuses, but the existing empty same-side candidate fallback crosses the part gate; later contact placement does not turn this into a strict part-side interpolation guarantee.
 * @evidence contracts/common.md#meaningful-documentation Members give fractional, integral and optional-clump domains, and the prose states the actual fallback and interpolation limitations.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Guide selection and candidate sorting belong to the builder/interpolator, not this fraction/count/clump record.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This schema defines no guide-arc cache; the interpolation call compiles cumulative guide lengths for its current population.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type owns no guide curves or station arrays; those populations live with the owning evaluation.
 * @author Samchon
 */
export interface IHumanFaceHairLayerGuides {
  /** Fraction of roots integrated as guides, in (0,1]. */
  fraction: number;

  /** Nearest guide count, integral in [1,8], with the stated same-side fallback. */
  neighbours: number;

  /** Optional tip attraction toward the nearest guide, in [0,1]. */
  clump?: number;
}
