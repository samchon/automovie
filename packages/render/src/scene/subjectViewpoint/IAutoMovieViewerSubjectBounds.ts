/**
 * Finite ordered world-space subject box in metres, supplied by its numerical owner. Zero extent is permitted; framing uses a conventional minimum neighbourhood radius.
 *
 * @evidence contracts/development/design.md#principled-representation Uses the structural min/max intersection of Engine bounds outputs; callers must supply finite ordered corners in the same world frame.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The viewer consumes bounds rather than rebuilding or registering authored geometry to estimate a second box.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The type performs no finite/order validation and does not certify that all currently drawn descendants are included.
 * @evidence contracts/development/common.md#meaningful-documentation States frame, units, input validity and degenerate-box framing behavior.
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
