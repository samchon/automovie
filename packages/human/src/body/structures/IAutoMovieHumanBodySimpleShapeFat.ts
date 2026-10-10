import type { IAutoMovieHumanBodySimpleShapeFatRegression } from "./IAutoMovieHumanBodySimpleShapeFatRegression";

/**
 * Deurenberg's two body fat regressions, the age interval between them and
 * the fat the definition gates subtract.
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
