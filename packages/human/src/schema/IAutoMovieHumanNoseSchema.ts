import type { IAutoMovieHumanNose } from "@automovie/interface";
import type { tags } from "typia";

/** Typia admission/schema metadata for IAutoMovieHumanNose. The canonical shape belongs to interface; this refinement adds its existing ranges and nested schema metadata. Import this schema type when generating validators or schemas: the plain canonical type intentionally carries no typia dependency. */
export type IAutoMovieHumanNoseSchema = IAutoMovieHumanNose & {
  /** Alare to alare. */
  width: number & tags.Minimum<10> & tags.Maximum<70>;

  /** Nasion to subnasale. */
  height: number & tags.Minimum<15> & tags.Maximum<90>;

  /** Subnasale to pronasale. */
  protrusion: number & tags.Minimum<4> & tags.Maximum<45>;
};
