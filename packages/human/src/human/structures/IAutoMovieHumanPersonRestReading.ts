/**
 * What a person's closed skin at rest measures: stature and enclosed volume.
 *
 * @evidence contracts/common.md#principled-implementation Both values are read from one rest skin of the whole person.
 * @evidence contracts/common.md#clear-and-simple-design Two values.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Neither value adds an allowance for a part the skin lacks.
 * @evidence contracts/common.md#meaningful-documentation States what each value is and its unit.
 * @evidence contracts/modeling.md#spatial-conventions Metres and cubic metres of the person frame, +Y up.
 * @evidence contracts/anatomy.md#anatomical-source Stature is the standing floor-to-vertex height the cited protocol defines.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The reading defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The reading carries no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The reading emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The reader owns the closed skin.
 * @evidenceExclude contracts/modeling.md#rendered-observation The reading is not displayed.
 * @evidenceExclude contracts/anatomy.md#permitted-range The reading admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The reading converts no input.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonRestReading {
  /** Highest minus lowest Float32 skin height at rest, metres. */
  statureMetres: number;

  /** Volume the closed Float32 skin encloses at rest, cubic metres. */
  volumeCubicMetres: number;
}
