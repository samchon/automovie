/**
 * The inclusive envelope of each simple parameter, the optional ones included.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodySimpleShapeLimits {
  /** Inclusive envelope of `sex`. */
  sex: [number, number];

  /** Inclusive envelope of `ageYears`. */
  ageYears: [number, number];

  /** Inclusive envelope of `statureMetres`. */
  statureMetres: [number, number];

  /** Inclusive envelope of `massKilograms`. */
  massKilograms: [number, number];

  /** Inclusive envelope of `muscle`. */
  muscle: [number, number];

  /** Inclusive envelope of `waistMetres`. */
  waistMetres: [number, number];

  /** Inclusive envelope of `hipsMetres`. */
  hipsMetres: [number, number];

  /** Inclusive envelope of `bustMetres`. */
  bustMetres: [number, number];

  /** Inclusive envelope of `shoulderMetres`. */
  shoulderMetres: [number, number];

  /** Inclusive envelope of `thighMetres`. */
  thighMetres: [number, number];

  /** Inclusive envelope of `upperArmMetres`. */
  upperArmMetres: [number, number];

  /** Inclusive envelope of `calfMetres`. */
  calfMetres: [number, number];
}
