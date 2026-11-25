/**
 * A point or direction retained in its owning segment frame, with optional
 * cross-joint placement notes.
 *
 * The interface package owns these declarations; AutoMovieHumanF1Placing in
 * Human supplies their runtime values.
 */
export namespace IAutoMovieHumanF1Placing {
  /** One placed quantity. */
  export interface IPlaced {
    /** The segment whose frame holds it. */
    frame: string;

    /** The point, mm, or the direction in that frame. */
    local: [number, number, number];

    /** How a relief's window lies on its course, when it crosses a joint. */
    note?: string;
  }
}
