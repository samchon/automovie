/** Type contracts exchanged by AutoMovieHumanHeadNoseFrame; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanHeadNoseFrame {
  /** The nose's measures at one height.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The nose's measures at one height.
   * @evidence contracts/development/design.md#principled-representation `span`: Length of the nose's axis, nasion over the pronasale, millimetres. `width`: The nose's half width, the alar lobules' half span, millimetres. `lead`: The tip's lead past the face, millimetres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanHeadNoseFrame.at. Read by AutoMovieHumanHeadNoseAla.lobes, AutoMovieHumanHeadNoseBridge.ridge, AutoMovieHumanHeadNoseTip.ball. Also types AutoMovieHumanHeadNose.frame.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `span`, `width`, `lead`, `v`, `lobeY`; callers supply the complete record.
   */
  export interface IFrame {
    /** Length of the nose's axis, nasion over the pronasale, millimetres. */
    span: number;

    /** The nose's half width, the alar lobules' half span, millimetres. */
    width: number;

    /** The tip's lead past the face, millimetres. */
    lead: number;

    /** Normalised height: 0 at the tip, 1 at the nasion, negative under the tip. */
    v: number;

    /** Height of the alar lobules' centre: the subnasale's plus a share of the span. */
    lobeY: number;
  }
}
