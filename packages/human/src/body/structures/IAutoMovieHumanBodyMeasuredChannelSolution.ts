/**
 * Result of `solveHumanBodyMeasuredChannel`: the fresh shape with the solved
 * channel's weight, and the instrument's reading on it.
 *
 * @evidence contracts/common.md#principled-implementation The reading is the instrument's value on the returned shape, not the requested target.
 * @evidence contracts/common.md#clear-and-simple-design Two fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The caller compares the requested target with this reading instead of assuming a fit.
 * @evidence contracts/common.md#meaningful-documentation States what each field is.
 * @evidence contracts/modeling.md#parameter-channels The shape differs from the input only in the solved channel.
 * @evidence contracts/modeling.md#spatial-conventions The reading is metres on the shaped rest skin.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping It defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation It is not displayed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The measurement rule owns the source.
 * @evidenceExclude contracts/anatomy.md#permitted-range The solver's inverse owns the reach.
 * @evidenceExclude contracts/anatomy.md#parametric-authority It converts no input.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyMeasuredChannelSolution {
  /** The solved shape. */
  shape: Record<string, number>;

  /** The instrument's reading on that shape, metres. */
  actualMetres: number;
}
