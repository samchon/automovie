/**
 * A canthus defined as an extreme of the joined margin rows: the margin vertex
 * whose final position has the minimum or maximum projection on a head-frame
 * axis.
 *
 * An extreme-type definition follows edits that move which vertex is the
 * corner, so the producer publishes it in place of a fixed vertex whenever
 * such a definition exists.
 *
 * @evidence contracts/common.md#principled-implementation Head-frame axis and min/max sense select a final posed vertex over the joined margin rows, permitting the corner identity to change with shape.
 * @evidence contracts/common.md#clear-and-simple-design Extreme kind and axis/sense define selection without a conflicting vertex; side registration owns the actual margins.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Selection reads registered current margins without screen coordinates or fitted points; missing registration remains unavailable, not a frozen neutral default.
 * @evidence contracts/common.md#meaningful-documentation The comment explains changing extreme identity; fields state discriminant, unit head-frame axis and sense.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This record executes no projection or margin scan.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The rule defines per-shape selection rather than caching one corner.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The basis owns a fixed axis triple; no margin buffer/task is acquired here.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceCanthusExtreme {
  /** Discriminant of the extreme-type definition. */
  kind: "extreme";

  /** Unit head-frame axis the joined margin rows are projected on. */
  axis: [number, number, number];

  /** Whether the canthus is the minimum or maximum projection. */
  sense: "minimum" | "maximum";
}
