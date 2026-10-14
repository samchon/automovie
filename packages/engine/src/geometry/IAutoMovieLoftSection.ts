import { IAutoMovieProfilePoint } from "./IAutoMovieProfilePoint";

/**
 * One authored station of a loft: where it sits along the path and the planar
 * region swept there.
 *
 * `loftAutoMovieSections` blends each path station from the two sections
 * around it, pairing point `k` of a ring with point `k` of the same ring in the
 * next section. Every section of one loft therefore declares the same number of
 * rings, the same point count per ring, and the same winding per ring as the
 * first section; the loft refuses any mismatch rather than resampling. The
 * first section sits at `0`, the last at `1`, and `at` strictly increases.
 *
 * @evidence contracts/common.md#principled-implementation A section is an authored planar region keyed by a chord-length fraction, so linear blending between two stations is defined point by point only because the ring layout matches, which the loft validates instead of inferring a correspondence.
 * @evidence contracts/common.md#clear-and-simple-design The outer ring plus optional holes is the same region shape `canonicalRegion` validates for planar profiles, so the loft reuses that validation and triangulation without a loft-specific ring format.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nothing is filled in for an author: a section with different ring counts, point counts or winding is refused by its index, never resampled or rewound to match.
 * @evidence contracts/common.md#meaningful-documentation States the chord-length meaning and range of `at`, the axes and unit of ring points, what an omitted `holes` means, and the correspondence rules the loft enforces across sections.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A data record with no runtime body; the blending cost is answered on `loftAutoMovieSections`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The loft reads each section once to lay out its rings and caches nothing on the record.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Caller-owned and read only; the loft copies ring points into its own canonical layout and retains no reference.
 * @author Samchon
 */
export interface IAutoMovieLoftSection {
  /**
   * Fraction of the path's chord length where the section sits, `0` at the
   * first path point and `1` at the last; finite and strictly greater than the
   * previous section's value.
   */
  at: number;

  /**
   * The enclosing ring in the path frame's right and up axes, in metres, as a
   * simple polygon whose point `k` corresponds to point `k` of every other
   * section's outer ring.
   */
  outer: readonly IAutoMovieProfilePoint[];

  /**
   * Rings removed from the section, each corresponding by index and point
   * order to the same hole of every other section; omitted means a solid
   * section.
   */
  holes?: ReadonlyArray<readonly IAutoMovieProfilePoint[]>;
}
