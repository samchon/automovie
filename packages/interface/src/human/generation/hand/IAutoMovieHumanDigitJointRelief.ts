/**
 * Arc-length location, window half-width and section radius for a digit-joint
 * relief.
 *
 * The interface package owns these declarations; AutoMovieHumanDigitJointRelief
 * in Human supplies their runtime values.
 */
export namespace IAutoMovieHumanDigitJointRelief {
  /** A joint's fixed inputs. */
  export interface IInput {
    /** Arc length of the joint's centre along the digit's line, mm. */
    at: number;

    /**
     * Half extent of the window along the line, mm; the joint's turn
     * half-length is the natural size.
     */
    half: number;

    /**
     * The joint's radius, mm: the mean of the section's half width and depth
     * there.
     */
    radius: number;
  }
}
