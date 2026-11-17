/** Type contracts exchanged by AutoMovieHumanMouthPrior; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanMouthPrior {
  /** One tooth's crown, millimetres.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One tooth's crown, millimetres.
   * @evidence contracts/development/design.md#principled-representation `name`: Name within its quadrant. `width`: Mesiodistal crown width, along the arch. `depth`: Labiolingual or buccolingual crown depth, across the arch.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanMouthArch.arch, AutoMovieHumanMouthArch.place. Also types AutoMovieHumanMouthPrior.UPPER, AutoMovieHumanMouthPrior.LOWER.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `name`, `width`, `depth`, `height`, `neck`, `kind`; callers supply the complete record.
   */
  export interface ITooth {
    /** Name within its quadrant. */
    name: string;

    /** Mesiodistal crown width, along the arch. */
    width: number;

    /** Labiolingual or buccolingual crown depth, across the arch. */
    depth: number;

    /** Cervicoincisal or cervico-occlusal crown height. */
    height: number;

    /** Mesiodistal width at the cervical line, where the crown meets the gum. */
    neck: number;

    /** Kind of crown: a blade, a cusp or a table. */
    kind: "incisor" | "canine" | "premolar" | "molar";
  }
}
