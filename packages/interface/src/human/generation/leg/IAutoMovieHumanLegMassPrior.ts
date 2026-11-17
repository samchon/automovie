/**
 * Bone-relative station shares and the fraction of section depth ahead of the bone.
 *
 * The interface package owns these declarations; AutoMovieHumanLegMassPrior in Human supplies their runtime values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Bone-relative station shares and the fraction of section depth ahead of the bone. Member comments specify the individual units, frames and optional-value meanings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups only IRow declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.
 * @evidence contracts/development/design.md#principled-representation IRow separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanLegMassPrior exchanges the named IRow contracts with its Human callers. Interface owns these type declarations without importing that implementation.
 */
export namespace IAutoMovieHumanLegMassPrior {
  /** One row: the bin's centre as a share from the proximal joint, and the front share there.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One row: the bin's centre as a share from the proximal joint, and the front share there.
   * @evidence contracts/development/design.md#principled-representation `share`: Station share from the segment's proximal joint (hip or knee) to its distal one. `front`: Share of the section's depth ahead of the bone's line.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanLegChain.rows, AutoMovieHumanLegMassPrior.THIGH.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `share`, `front`; callers supply the complete record.
   */
  export interface IRow {
    /** Station share from the segment's proximal joint (hip or knee) to its distal one. */
    share: number;

    /** Share of the section's depth ahead of the bone's line. */
    front: number;
  }
}
