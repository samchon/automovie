import { IAutoMovieExplicitInstanceTransform } from "@automovie/interface";

/**
 * Explicit instance slots and the occurrences that cannot become one.
 *
 * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `IAutoMoviePatternInstancing` represents explicit instance slots and the occurrences that cannot become one. This ensures authored physical-module placement and texture sampling remain under project control.
 * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `IAutoMoviePatternInstancing` structures explicit instance slots and the occurrences that cannot become one for the system that resolves the declared physical-module pattern deterministically.
 */
export interface IAutoMoviePatternInstancing {
  /**
   * One exact full-TRS slot per whole occurrence, in placement order.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `transforms` records `IAutoMoviePatternInstancing`'s one exact full-TRS slot per whole occurrence, in placement order. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `transforms` supplies `IAutoMoviePatternInstancing`'s one exact full-TRS slot per whole occurrence, in placement order when the engine resolves the declared physical-module pattern deterministically.
   */
  transforms: IAutoMovieExplicitInstanceTransform[];
  /**
   * Occurrence ids that were cut and therefore need their own geometry.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `cut` records `IAutoMoviePatternInstancing`'s occurrence ids that were cut and therefore need their own geometry. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `cut` supplies `IAutoMoviePatternInstancing`'s occurrence ids that were cut and therefore need their own geometry when the engine resolves the declared physical-module pattern deterministically.
   */
  cut: string[];
}
