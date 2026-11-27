/**
 * The full millimetre breadth and depth of a lumbar section at its requested
 * girth. Runtime construction and admission remain with
 * AutoMovieHumanLumbarSection in Human.
 */
export namespace IAutoMovieHumanLumbarSection {
  /**
   * Full transverse breadth and front-to-back depth in millimetres for the
   * requested lumbar girth. The box bounds the girth admitted by the owning
   * section solve.
   */
  export type IBoxResult = {
    /** Full transverse section breadth, millimetres. */
    breadth: number;
    /** Full front-to-back section depth, millimetres. */
    depth: number;
  };
}
