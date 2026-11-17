/**
 * A point or direction retained in its owning segment frame, with optional cross-joint placement notes.
 *
 * The interface package owns these declarations; AutoMovieHumanF1Placing in Human supplies their runtime values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation A point or direction retained in its owning segment frame, with optional cross-joint placement notes. Member comments specify the individual units, frames and optional-value meanings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups only IPlaced declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.
 * @evidence contracts/development/design.md#principled-representation IPlaced separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanF1Placing exchanges the named IPlaced contracts with its Human callers. Interface owns these type declarations without importing that implementation.
 */
export namespace IAutoMovieHumanF1Placing {
  /** One placed quantity.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One placed quantity.
   * @evidence contracts/development/design.md#principled-representation `frame`: The segment whose frame holds it. `local`: The point, mm, or the direction in that frame. `note`: How a relief's window lies on its course, when it crosses a joint.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanF1Placing.POINTS, AutoMovieHumanF1Placing.DIRECTIONS.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts `note`: How a relief's window lies on its course, when it crosses a joint.
   */
  export interface IPlaced {
    /** The segment whose frame holds it. */
    frame: string;

    /** The point, mm, or the direction in that frame. */
    local: [number, number, number];

    /** How a relief's window lies on its course, when it crosses a joint. */
    note?: string;
  }
}
