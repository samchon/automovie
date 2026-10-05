import type { IAutoMovieHumanBodySimpleShapeFatRegression } from "./IAutoMovieHumanBodySimpleShapeFatRegression";

/**
 * Deurenberg's two body fat regressions, the age interval between them and
 * the fat the definition gates subtract.
 *
 * @evidence contracts/common.md#principled-implementation The fat block's fields, extracted from the table declaration without change.
 * @evidence contracts/common.md#clear-and-simple-design Two regressions, an interval and two curves over sex.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The table is data, audited and tuned as rows, never as code.
 * @evidence contracts/common.md#meaningful-documentation States each field and why the muscle correction exists.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The record names channels the body basis declares; it defines none.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Years, percent and kg/m²; no coordinate.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The record builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The record is not displayed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries the regressions' coefficients; the table documentation cites the study.
 * @evidenceExclude contracts/anatomy.md#permitted-range The record carries table values; admission of the simple tier owns the bounds.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The record is table data, not an input a document sets.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodySimpleShapeFat {
  /** The regression for children. */
  pediatric: IAutoMovieHumanBodySimpleShapeFatRegression;

  /** The regression for adults. */
  adult: IAutoMovieHumanBodySimpleShapeFatRegression;

  /** Authored interpolation interval; the study reports separate age domains. */
  transitionAgeYears: [number, number];

  /** Essential fat percent over sex, as `[sex, percent]` points. */
  essentialBySex: [number, number][];

  /**
   * Fat-free mass index (kg/m²) one unit of the muscle parameter adds over
   * the regression's body at the same stature and mass, by sex: the fat
   * the definition gates read is the regression's less the mass that
   * muscle displaces (`100 · Δ · muscle / BMI` points). Deurenberg's
   * regression knows no muscularity, so without this an athlete reads the
   * fat of an untrained body of the same mass index.
   */
  muscleFatFreeMassIndex: [number, number][];
}
