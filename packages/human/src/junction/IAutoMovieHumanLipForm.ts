/** Shared physical lip-loop placement, consumed by geometry and pigmentation.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanLipForm {
    /** Share of the way from the opening's rim to the vermilion border at which the loop of orbicularis oris runs. */
    orbicularis: number;

    /** Distance between the crista philtri points, the cupid's bow's peaks, over mouth width. */
    philtrum: number;

    /** Half the gap between the vermilion borders at each commissure, millimetres, so the commissure is a short edge. */
    commissure: number;

    /** The meeting line: depth behind the lips' surface and half-opening, millimetres, and width over the mouth's. */
    meeting: { back: number; open: number; narrow: number };

    /** The pocket's wall behind the lips: depth and half-opening, millimetres, and width over the mouth's. */
    pocket: { back: number; open: number; narrow: number };

}
/** The anterior roll dimensions accompanying the shared lip border. */
export namespace IAutoMovieHumanLipForm {
  /** Existing conventional anterior roll amplitude over face height.
   *
   * @author Samchon
   */
  export interface IRelief {
    /** Forward height over face height. */
    roll: number;
  }
}
