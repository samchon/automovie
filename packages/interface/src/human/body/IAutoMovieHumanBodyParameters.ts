import type { IAutoMovieHumanBodyAnatomy } from "./IAutoMovieHumanBodyAnatomy";

/**
 * Primary body parameter record. Lengths use mm; each field keeps the unit and
 * the published definition its own documentation states.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Primary body parameter record.
 * @evidence contracts/development/design.md#principled-representation `anatomy`: Stature, tapes, segment lengths, skeletal breadths, landmark heights and fat percentage; each omitted measure takes its survey default.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanBodyParameters is the canonical exchange used by IAutoMovieHumanBodyParametersSchema, IAutoMovieHumanParameters.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `anatomy`; callers supply the complete record.
 */
export interface IAutoMovieHumanBodyParameters {
  /** Stature, tapes, segment lengths, skeletal breadths, landmark heights and fat percentage; each omitted measure takes its survey default. */
  anatomy: IAutoMovieHumanBodyAnatomy;
}
