import type { IAutoMovieHumanNose } from "@automovie/interface";
import type { tags } from "typia";

/**
 * Nasal width, height and protrusion for typia validation, in millimetres.
 * Measure width between the alae, height from nasion to subnasale, and
 * protrusion from subnasale to pronasale.
 */
export type IAutoMovieHumanNoseSchema = IAutoMovieHumanNose & {
  /** Alare to alare. */
  width: number & tags.Minimum<10> & tags.Maximum<70>;

  /** Nasion to subnasale. */
  height: number & tags.Minimum<15> & tags.Maximum<90>;

  /** Subnasale to pronasale. */
  protrusion: number & tags.Minimum<4> & tags.Maximum<45>;
};
