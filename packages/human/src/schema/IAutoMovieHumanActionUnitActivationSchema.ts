import type { IAutoMovieHumanActionUnitActivation } from "@automovie/interface";
import type { tags } from "typia";

/** Typia admission/schema metadata for IAutoMovieHumanActionUnitActivation. The canonical shape belongs to interface; this refinement adds its existing ranges and nested schema metadata. Import this schema type when generating validators or schemas: the plain canonical type intentionally carries no typia dependency. */
export type IAutoMovieHumanActionUnitActivationSchema =
  IAutoMovieHumanActionUnitActivation & {
    /**
     * Intensity from rest (0) to maximum (1). The FACS letter grades A (trace) to E (maximum) fall at about 0.2, 0.4, 0.6, 0.8 and 1.
     */
    intensity: number & tags.Minimum<0> & tags.Maximum<1>;
  };
