import { IAutoMoviePatternPoint } from "./IAutoMoviePatternPoint";

/**
 * One convex face-local area a pattern must leave uncovered.
 *
 * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `IAutoMoviePatternExclusion` represents one convex face-local area a pattern must leave uncovered. This ensures authored physical-module placement and texture sampling remain under project control.
 * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `IAutoMoviePatternExclusion` structures one convex face-local area a pattern must leave uncovered for the system that resolves the declared physical-module pattern deterministically.
 */
export interface IAutoMoviePatternExclusion {
  /**
   * Stable exclusion id, unique inside one pattern.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `id` records `IAutoMoviePatternExclusion`'s stable exclusion id, unique inside one pattern. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `id` supplies `IAutoMoviePatternExclusion`'s stable exclusion id, unique inside one pattern when the engine resolves the declared physical-module pattern deterministically.
   */
  id: string;
  /**
   * Convex face-local polygon of at least three points.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `polygon` records `IAutoMoviePatternExclusion`'s convex face-local polygon of at least three points. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `polygon` supplies `IAutoMoviePatternExclusion`'s convex face-local polygon of at least three points when the engine resolves the declared physical-module pattern deterministically.
   */
  polygon: IAutoMoviePatternPoint[];
}
