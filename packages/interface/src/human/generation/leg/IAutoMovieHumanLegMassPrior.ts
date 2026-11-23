/**
 * Bone-relative station shares and the fraction of section depth ahead of the
 * bone.
 *
 * The interface package owns these declarations; AutoMovieHumanLegMassPrior in
 * Human supplies their runtime values.
 */
export namespace IAutoMovieHumanLegMassPrior {
  /**
   * One row: the bin's centre as a share from the proximal joint, and the front
   * share there.
   */
  export interface IRow {
    /**
     * Station share from the segment's proximal joint (hip or knee) to its
     * distal one.
     */
    share: number;

    /** Share of the section's depth ahead of the bone's line. */
    front: number;
  }
}
