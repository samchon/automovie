/**
 * The shoulder outline point's vertical and lateral millimetre coordinates.
 * Runtime construction and admission remain with AutoMovieHumanShoulderLine in
 * Human.
 */
export namespace IAutoMovieHumanShoulderLine {
  /** The shoulder point's place on the outline. */
  export interface IPoint {
    /** Height of the shoulder point, mm. */
    y: number;

    /**
     * Its lateral place, mm: half the biacromial breadth the course input
     * fixes.
     */
    z: number;
  }
}
