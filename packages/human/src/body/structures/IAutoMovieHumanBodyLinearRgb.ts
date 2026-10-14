/**
 * A linear RGB colour, each channel in [0,1], without an sRGB transfer.
 *
 * @evidence contracts/common.md#principled-implementation Three scalar components represent linear RGB in the documented unit interval; this interface performs no transfer or validation.
 * @evidence contracts/common.md#clear-and-simple-design Colour remains a plain record shared by material overrides and skin controls.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The colour space is explicit instead of relying on a renderer-specific interpretation.
 * @evidence contracts/common.md#meaningful-documentation The declaration distinguishes linear channels from sRGB and documents their range.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The linear colour components declaration is erased by TypeScript and chooses no runtime algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The linear colour components schema coordinates no requests or cached computations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The linear colour components type acquires no handles, tasks or retained storage.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyLinearRgb {
  /** Red. */
  r: number;

  /** Green. */
  g: number;

  /** Blue. */
  b: number;
}
