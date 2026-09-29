import type { IAutoMovieHumanBodyMeasuredLength } from "./IAutoMovieHumanBodyMeasuredLength";

/**
 * A target internal length or an imaging observation of the same landmarks.
 * The scalar alone cannot determine an individual bone surface or joint pose.
 * @author Samchon
 */
export type IAutoMovieHumanBodyAnatomicalLength =
  | { readonly kind: "target"; readonly millimetres: number }
  | IAutoMovieHumanBodyMeasuredLength;
