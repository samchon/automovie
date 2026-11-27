/**
 * Bouncing on a trampoline: straight bounces that build toward an apex, a shape
 * held at each flight's apex, and a kill that absorbs the last landing to a
 * stop.
 */
export namespace IAutoMovieMotionHumanTrampoline {
  /** The shape held at a flight's apex. */
  export type Shape = "straight" | "tuck" | "pike" | "straddle";

  /** Parameters. */
  export interface IParams {
    /**
     * The trampoline's scene id; the jumper stands on its bed as the action
     * starts.
     */
    on: string;

    /** How many bounces, a whole number of at least 1; 4 when absent. */
    bounces?: number;

    /**
     * The apex the bounces build toward, the feet's height above the bed,
     * metres, positive; 1 when absent. Refused beyond what the legs' push can
     * sustain.
     */
    apex?: number;

    /** The shape held at each apex; `straight` when absent. */
    shape?: Shape;
  }
}
