/**
 * Finite ordered world-space subject box in metres, supplied by its numerical owner. Zero extent is permitted; framing uses a conventional minimum neighbourhood radius.
 *
 * @evidence contracts/common.md#principled-implementation Uses the structural min/max intersection of Engine bounds outputs; callers must supply finite ordered corners in the same world frame.
 * @evidence contracts/common.md#clear-and-simple-design The viewer consumes bounds rather than rebuilding or registering authored geometry to estimate a second box.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The type performs no finite/order validation and does not certify that all currently drawn descendants are included.
 * @evidence contracts/common.md#meaningful-documentation States frame, units, input validity and degenerate-box framing behavior.
 * @evidence contracts/performance.md#efficient-algorithms Six scalar coordinates choose no scanning strategy; Engine derivation and any current scene validation retain their own costs.
 * @evidence contracts/performance.md#reuse-equivalent-work Bounds may be reused only while geometry, placement and population resolution remain equivalent; the shape carries no invalidation mechanism.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The value record owns no geometry or native buffer; its caller owns current derivation and references.
 *
 * @author Samchon
 */
export interface IAutoMovieViewerSubjectBounds {
  /**
   * Lower world corner, in metres.
   */
  min: { x: number; y: number; z: number };

  /**
   * Upper world corner, in metres.
   */
  max: { x: number; y: number; z: number };
}
