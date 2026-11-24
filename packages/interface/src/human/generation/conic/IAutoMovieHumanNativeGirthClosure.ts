/**
 * Results of closing a material conic section on a prescribed girth.
 */
export namespace IAutoMovieHumanNativeGirthClosure {
  /**
   * The source fields and tape at the admitted fullness.
   */
  export interface IClosed {
    /** Common logit shift of the fullness shares. Zero preserves the given section. */
    fullness: number;

    /** Original-order section field vector, with only the fullness shares moved. */
    values: readonly number[];

    /** Length of the taut tape in millimetres. */
    tape: number;
  }
}
