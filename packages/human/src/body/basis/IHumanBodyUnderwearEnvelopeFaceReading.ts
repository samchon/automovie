/**
 * Complete qualified centre-field direction over a planar material face. Positive possible-centre directions bound every active branch. An opposing centre refuses only when its exact restricted Voronoi cell is nonempty.
 *
 * @evidence contracts/common.md#principled-implementation Minimum orientation, candidate count, active invalid branches and explicit unavailability describe the complete qualified field over one planar material face.
 * @evidence contracts/common.md#clear-and-simple-design One readback separates domain failures from actual opposing active directions and population accounting.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Candidate counts cannot replace direction validity, and unavailable or undefined direction cannot be treated as acceptance.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish meter direction bounds, complete candidates, restricted active branches and refusal reasons.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Face-reading typing executes no exact Voronoi restriction or spatial candidate traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Complete-face outputs contain no cross-face query cache or active-branch invalidation mechanism.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Scalar face observations acquire no candidate hierarchy, polygon cells or retained query resource.
 * @author Samchon
 */
export interface IHumanBodyUnderwearEnvelopeFaceReading {
  /** Positive lower bound, or minimum opposing active direction, in metres. */
  minimumOrientation: number | null;

  /** Complete spatial candidate population; no centre count is changed. */
  candidates: number;

  /** Opposing or directionless branches with a nonempty exact active cell. */
  activeInvalidBranches: number;

  /** Unrepresentable or undefined direction prevents acceptance. */
  unavailable: string | null;
}
