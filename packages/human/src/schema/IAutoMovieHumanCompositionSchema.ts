import type { IAutoMovieHumanComposition } from "@automovie/interface";
import type { tags } from "typia";

import type { IAutoMovieHumanSubcutaneousFatSchema } from "./IAutoMovieHumanSubcutaneousFatSchema";

/**
 * Detailed body composition for typia validation. Supply whole-body fat
 * percentage, limb lean-mass index in kilograms per square metre and regional
 * subcutaneous thicknesses in millimetres.
 */
export type IAutoMovieHumanCompositionSchema = IAutoMovieHumanComposition & {
  /** Whole-body fat mass over body mass, percent. */
  bodyFatPercentage: number & tags.Minimum<2> & tags.Maximum<75>;

  /**
   * Appendicular lean mass index: lean mass of the arms and legs over stature squared, kilograms per square metre. NHANES means are 6.81 for women and 8.87 for men at age 20 (Kelly et al. 2009).
   */
  appendicularLeanMassIndex: number & tags.Minimum<2> & tags.Maximum<16>;

  /** Subcutaneous fat thickness in millimetres at each named site. */
  subcutaneousFat: IAutoMovieHumanSubcutaneousFatSchema;
};
