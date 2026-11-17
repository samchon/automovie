/**
 * Build as four independent offsets, each zero at the population mean.
 *
 * Adiposity and muscularity stay separate because body mass index mixes fat and lean mass: a muscular person and a fat person of equal index differ in where volume sits and in muscle relief.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Build as four independent offsets, each zero at the population mean.
 * @evidence contracts/development/design.md#principled-representation `adiposity`: Body fat: positive is fatter, negative leaner. `muscularity`: Lean mass: positive is more muscular, negative less. `slimness`: Skeletal frame: positive is a narrower frame with longer limbs for the stature, negative a broader, shorter-limbed frame.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanBuildTraits is the canonical exchange used by IAutoMovieHumanBuildTraitsSchema, IAutoMovieHumanTraits.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `adiposity`, `muscularity`, `slimness`, `cuteness`; callers supply the complete record.
 */
export interface IAutoMovieHumanBuildTraits {
  /** Body fat: positive is fatter, negative leaner. Schema constraints: Minimum: -1; Maximum: 1; retained by Human's schema refinement. */
  adiposity: number;

  /** Lean mass: positive is more muscular, negative less. Schema constraints: Minimum: -1; Maximum: 1; retained by Human's schema refinement. */
  muscularity: number;

  /**
   * Skeletal frame: positive is a narrower frame with longer limbs for the stature, negative a broader, shorter-limbed frame. Schema constraints: Minimum: -1; Maximum: 1; retained by Human's schema refinement. */
  slimness: number;

  /**
   * Facial neoteny: positive moves the face toward child-like proportions (a vault large relative to the face, larger eyes relative to the face, a shorter nose, a smaller mouth), negative toward a more mature face. Schema constraints: Minimum: -1; Maximum: 1; retained by Human's schema refinement. */
  cuteness: number;
}
