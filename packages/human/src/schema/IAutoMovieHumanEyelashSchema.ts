import type { IAutoMovieHumanEyelash } from "@automovie/interface";
import type { tags } from "typia";

/** Typia admission/schema metadata for IAutoMovieHumanEyelash. The canonical shape belongs to interface; this refinement adds its existing ranges and nested schema metadata. Import this schema type when generating validators or schemas: the plain canonical type intentionally carries no typia dependency. */
export type IAutoMovieHumanEyelashSchema = IAutoMovieHumanEyelash & {
  /**
   * Length of the longest upper lash, millimetres; natural lashes rarely exceed 12 mm (Aumond and Bitton 2018, J Optom 11(4):211-222).
   */
  length: number & tags.Minimum<0> & tags.Maximum<15>;
};
