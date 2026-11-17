import type { AutoMovieVector3Tuple } from "../../geometry/AutoMovieVector3Tuple";

/** Type contracts exchanged by AutoMovieHumanGlutealFrame; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanGlutealFrame {
  /** What the frame reads.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation What the frame reads.
   * @evidence contracts/development/design.md#principled-representation `apex`: The buttock point on the wall, `[x, y, z]`, mm. `tangent`: The wall's section tangent at the apex in `[x, z]`, in the direction of rising phase (back: z falling).
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanGlutealFrame.create.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `apex`, `tangent`; callers supply the complete record.
   */
  export interface IInput {
    /** The buttock point on the wall, `[x, y, z]`, mm. */
    apex: AutoMovieVector3Tuple;

    /** The wall's section tangent at the apex in `[x, z]`, in the direction of rising phase (back: z falling). */
    tangent: [number, number];
  }
}
