import { IAutoMoviePatternTextureTransform } from "./IAutoMoviePatternTextureTransform";

/**
 * UV transforms and the occurrences that transform cannot express.
 *
 * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `IAutoMoviePatternTexturing` represents uV transforms and the occurrences that transform cannot express. This ensures authored physical-module placement and texture sampling remain under project control.
 * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `IAutoMoviePatternTexturing` structures uV transforms and the occurrences that transform cannot express for the system that resolves the declared physical-module pattern deterministically.
 */
export interface IAutoMoviePatternTexturing {
  /**
   * One transform per expressible occurrence, in placement order.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `transforms` records `IAutoMoviePatternTexturing`'s one transform per expressible occurrence, in placement order. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `transforms` supplies `IAutoMoviePatternTexturing`'s one transform per expressible occurrence, in placement order when the engine resolves the declared physical-module pattern deterministically.
   */
  transforms: IAutoMoviePatternTextureTransform[];
  /**
   * Occurrence ids whose sampling needs a shear the transform has no term for.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `sheared` records `IAutoMoviePatternTexturing`'s occurrence ids whose sampling needs a shear the transform has no term for. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `sheared` supplies `IAutoMoviePatternTexturing`'s occurrence ids whose sampling needs a shear the transform has no term for when the engine resolves the declared physical-module pattern deterministically.
   */
  sheared: string[];
}
