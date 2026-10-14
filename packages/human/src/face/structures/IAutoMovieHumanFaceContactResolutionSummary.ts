/**
 * The contact correction applied to one resident soft surface. The evaluator groups exactly coincident posed coordinates, retaining every member's distinct rest-floor witnesses; that grouping does not establish canonical source identity. Counts include directly corrected groups and exclude spread-only neighbours. Depth is the largest initial excess past a rest-clearance floor, not net correction travel or absolute collider depth. A count certifies no whole-surface intersection or visual acceptance.
 *
 * @evidence contracts/common.md#principled-implementation Surface identity, directly corrected coordinate-coincident posed group count and maximum initial floor excess describe the actual staged correction; spread-only neighbours are excluded from the count.
 * @evidence contracts/common.md#clear-and-simple-design Three scalar outputs separate affected population from initial shortfall without retaining posed mesh buffers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Posed coordinate coincidence proves no canonical physical identity, floor excess is not net movement, and these metrics prove no whole-skin topology or visual acceptance.
 * @evidence contracts/common.md#meaningful-documentation The comment defines current grouping, retained rest witnesses, direct population and floor-relative depth; members state surface and metres.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This result type performs no correction, grouping or signed query.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Correction summaries are outputs, not a repeated-contact cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns scalar reports and the declaration acquires no staging arrays/task.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceContactResolutionSummary {
  /** Existing soft basis surface identity. */
  surface: string;

  /** Directly corrected coordinate-coincident posed groups, excluding spread-only neighbours. */
  vertices: number;

  /** Largest initial excess past an original rest-clearance floor, metres. */
  maxDepthMetres: number;
}
