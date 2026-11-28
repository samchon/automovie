import type { IAutoMovieHumanActionUnitActivation } from "@automovie/interface";
import type { tags } from "typia";

/**
 * One facial action code and anatomical side selection, with a normalized
 * intensity in [0, 1]. Use this type when generating a typia validator or
 * schema for expression inputs.
 */
export type IAutoMovieHumanActionUnitActivationSchema =
  IAutoMovieHumanActionUnitActivation & {
    /**
     * Normalized intensity from rest (0) to maximum (1).
     */
    intensity: number & tags.Minimum<0> & tags.Maximum<1>;
  };
