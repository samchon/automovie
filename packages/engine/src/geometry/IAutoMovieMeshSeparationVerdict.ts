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
 * @evidence contracts/development/design.md#principled-representation `separated` copies `certified` from the same walk the full measurement runs and takes `witness` from the triangle that ended it, so the pair cannot disagree with a full measurement about acceptance.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two fields because the hair fit only accepts or rejects a row; the witness names the refuting face for diagnostics without the bound and caps that would cost a complete walk.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The witness is the face the walk actually stopped at, not the closest or the lowest-ordinal face, and the documentation says so rather than implying a global minimum.
 * @evidence contracts/development/common.md#meaningful-documentation States the equivalence with the full result, why no bound or caps are reported, and that the witness is the first refuting face in walk order or -1 when certified.
 */
export interface IAutoMovieMeshSeparationVerdict {
  /**
   * Whether the complete feature proved at least the requested separation;
   * false means unproved, including touches, crossings and rounding at an
   * exact limit.
   */
  certified: boolean;

  /**
   * Original ordinal of the resident triangle or attachment support that ended
   * the walk by refuting the feature, the first in walk order rather than the
   * closest, or -1 when the feature is certified.
   */
  witness: number;
}
