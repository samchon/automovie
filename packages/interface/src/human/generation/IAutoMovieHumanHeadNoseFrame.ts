/**
 * Physical nose dimensions and the normalized nasion-to-tip height coordinate.
 * Runtime construction and admission remain with AutoMovieHumanHeadNoseFrame in
 * Human.
 */
export namespace IAutoMovieHumanHeadNoseFrame {
  /** The nose's measures at one height. */
  export interface IFrame {
    /** Length of the nose's axis, nasion over the pronasale, millimetres. */
    span: number;

    /** The nose's half width, the alar lobules' half span, millimetres. */
    width: number;

    /** The tip's lead past the face, millimetres. */
    lead: number;

    /** Normalised height: 0 at the tip, 1 at the nasion, negative under the tip. */
    v: number;

    /**
     * Height of the alar lobules' centre: the subnasale's plus a share of the
     * span.
     */
    lobeY: number;
  }
}
