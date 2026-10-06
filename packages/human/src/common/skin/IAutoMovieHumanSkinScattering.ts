/**
 * How far light travels under skin before it leaves again, per linear RGB
 * primary, in metres.
 *
 * @evidence contracts/common.md#principled-implementation One distance per primary is the form a renderer's diffusion profile and the material's `subsurfaceRadius` take.
 * @evidence contracts/common.md#clear-and-simple-design Three numbers with one unit.
 * @evidence contracts/common.md#meaningful-documentation States the quantity and its unit.
 * @evidence contracts/modeling.md#spatial-conventions Metres, linear sRGB primaries.
 */
export interface IAutoMovieHumanSkinScattering {
  /** Red primary, metres. */
  r: number;

  /** Green primary, metres. */
  g: number;

  /** Blue primary, metres. */
  b: number;
}
