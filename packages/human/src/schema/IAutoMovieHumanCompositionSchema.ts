import type { IAutoMovieHumanComposition } from "@automovie/interface";
import type { tags } from "typia";

import type { IAutoMovieHumanSubcutaneousFatSchema } from "./IAutoMovieHumanSubcutaneousFatSchema";

/** Typia admission/schema metadata for IAutoMovieHumanComposition. The canonical shape belongs to interface; this refinement adds its existing ranges and nested schema metadata. Import this schema type when generating validators or schemas: the plain canonical type intentionally carries no typia dependency. */
export type IAutoMovieHumanCompositionSchema = IAutoMovieHumanComposition & {
  /** Whole-body fat mass over body mass, percent. */
  bodyFatPercentage: number & tags.Minimum<2> & tags.Maximum<75>;

  /**
   * Appendicular lean mass index: lean mass of the arms and legs over stature squared, kilograms per square metre. NHANES means are 6.81 for women and 8.87 for men at age 20 (Kelly et al. 2009).
   */
  appendicularLeanMassIndex: number & tags.Minimum<2> & tags.Maximum<16>;

  /** Subcutaneous fat thickness over each region, the fat that decides how sharply muscle shows. */
  subcutaneousFat: IAutoMovieHumanSubcutaneousFatSchema;
};
