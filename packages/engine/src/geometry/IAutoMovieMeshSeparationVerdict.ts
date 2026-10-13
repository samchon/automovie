/**
 * Answer of a refutation-only mesh separation query: whether one complete
 * feature is separated from the resident surface by at least the requested
 * clearance.
 *
 * `certified` has exactly the meaning of {@link IAutoMovieMeshSeparationResult}'s
 * field for the same compiled snapshot, feature and options. The query stops at
 * the first resident triangle whose conservative bound falls below the target,
 * so it reports no global lower bound, closest triangle or attachment caps.
 *
 * @author Samchon
 */
export interface IAutoMovieMeshSeparationVerdict {
  /**
   * Whether the complete feature proved at least the requested separation;
   * false means unproved, including touches, crossings and rounding at an
   * exact limit.
   */
  certified: boolean;

  /**
   * Original ordinal of the first resident triangle (or attachment support)
   * that refuted the feature, or -1 when the feature is certified.
   */
  witness: number;
}
