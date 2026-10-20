import { tags } from "typia";

import { IAutoMovieHumanSubcutaneousFat } from "./IAutoMovieHumanSubcutaneousFat";

/**
 * Fat and lean mass as two quantities.
 *
 * Body mass index mixes fat and lean, so a muscular person and a fat person of equal index must not be built alike; fat decides where volume sits and how soft the surface reads, lean mass decides muscle relief. Both are dual-energy X-ray absorptiometry quantities, as in the NHANES reference values (Kelly et al. 2009, PLoS ONE 4(9):e7038).
 */
export interface IAutoMovieHumanComposition {
  /** Whole-body fat mass over body mass, percent. */
  bodyFatPercentage: number & tags.Minimum<2> & tags.Maximum<75>;

  /**
   * Appendicular lean mass index: lean mass of the arms and legs over stature squared, kilograms per square metre. NHANES means are 6.81 for women and 8.87 for men at age 20 (Kelly et al. 2009).
   */
  appendicularLeanMassIndex: number & tags.Minimum<2> & tags.Maximum<16>;

  /** Subcutaneous fat thickness over each region, the fat that decides how sharply muscle shows. */
  subcutaneousFat: IAutoMovieHumanSubcutaneousFat;
}
