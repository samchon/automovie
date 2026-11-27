/**
 * Crease placement inputs and ordered joint-to-crease arclength tuples in
 * millimetres. Runtime construction and admission remain with
 * AutoMovieHumanDigitCrease in Human.
 */
export namespace IAutoMovieHumanDigitCrease {
  /** A crease's fixed inputs. */
  export interface IInput {
    /** Arc length of the crease along the digit's line, mm. */
    at: number;

    /** The palmar depth of the section there, mm. */
    palmar: number;

    /** The nearest joint's radius, mm. */
    radius: number;
  }

  /**
   * Readonly MCP, PIP and DIP arclengths along the finger from its root, in
   * millimetres. The crease law consumes the three anatomical joints in that
   * order.
   */
  export type LociJoints = readonly [number, number, number];

  /**
   * Four finger crease arclengths in millimetres, distal first, derived from
   * the input joint stations by the documented Bridgman rule.
   */
  export type LociResult = [number, number, number, number];
}
