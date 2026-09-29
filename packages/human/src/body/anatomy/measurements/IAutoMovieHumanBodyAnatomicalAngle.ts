import type { IAutoMovieHumanBodyMeasuredAngle } from "./IAutoMovieHumanBodyMeasuredAngle";

/** A target clinical angle or an imaged angle between the same axes. @author Samchon */
export type IAutoMovieHumanBodyAnatomicalAngle =
  | { readonly kind: "target"; readonly degrees: number }
  | IAutoMovieHumanBodyMeasuredAngle;
