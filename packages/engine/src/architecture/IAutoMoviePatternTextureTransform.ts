/**
 * One occurrence's sampling of its material, in the PBR record's own UV
 * transform.
 *
 * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `IAutoMoviePatternTextureTransform` represents one occurrence's sampling of its material, in the PBR record's own UV transform. This ensures authored physical-module placement and texture sampling remain under project control.
 * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `IAutoMoviePatternTextureTransform` structures one occurrence's sampling of its material, in the PBR record's own UV transform for the system that resolves the declared physical-module pattern deterministically.
 */
export interface IAutoMoviePatternTextureTransform {
  /**
   * The occurrence this samples for.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `id` records `IAutoMoviePatternTextureTransform`'s occurrence this samples for. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `id` supplies `IAutoMoviePatternTextureTransform`'s occurrence this samples for when the engine resolves the declared physical-module pattern deterministically.
   */
  id: string;
  /**
   * Normalized UV offset.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `offset` records `IAutoMoviePatternTextureTransform`'s normalized UV offset. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `offset` supplies `IAutoMoviePatternTextureTransform`'s normalized UV offset when the engine resolves the declared physical-module pattern deterministically.
   */
  offset: {
    /** Offset along the texture's own U axis. */
    x: number;
    /** Offset along the texture's own V axis. */
    y: number;
  };
  /**
   * Normalized UV scale; a negative `x` is the mirrored piece.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `scale` records `IAutoMoviePatternTextureTransform`'s normalized UV scale; a negative `x` is the mirrored piece. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `scale` supplies `IAutoMoviePatternTextureTransform`'s normalized UV scale; a negative `x` is the mirrored piece when the engine resolves the declared physical-module pattern deterministically.
   */
  scale: {
    /** Scale along the texture's own U axis. */
    x: number;
    /** Scale along the texture's own V axis. */
    y: number;
  };
  /**
   * UV rotation in degrees, within `[-180, 180]`.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `rotationDeg` records `IAutoMoviePatternTextureTransform`'s uV rotation in degrees, within `[-180, 180]`. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `rotationDeg` supplies `IAutoMoviePatternTextureTransform`'s uV rotation in degrees, within `[-180, 180]` when the engine resolves the declared physical-module pattern deterministically.
   */
  rotationDeg: number;
}
