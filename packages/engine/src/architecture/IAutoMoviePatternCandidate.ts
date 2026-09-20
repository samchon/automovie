import { IAutoMoviePatternPoint } from "./IAutoMoviePatternPoint";

/**
 * One module a zone's own program proposes, before any clipping.
 *
 * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `IAutoMoviePatternCandidate` represents one module a zone's own program proposes, before any clipping. This ensures authored physical-module placement and texture sampling remain under project control.
 * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `IAutoMoviePatternCandidate` structures one module a zone's own program proposes, before any clipping for the system that resolves the declared physical-module pattern deterministically.
 */
export interface IAutoMoviePatternCandidate {
  /**
   * Stable module identity, unique inside its zone.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `id` records `IAutoMoviePatternCandidate`'s stable module identity, unique inside its zone. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `id` supplies `IAutoMoviePatternCandidate`'s stable module identity, unique inside its zone when the engine resolves the declared physical-module pattern deterministically.
   */
  id: string;
  /**
   * Module centre in face-local metres.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `center` records `IAutoMoviePatternCandidate`'s module centre in face-local metres. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `center` supplies `IAutoMoviePatternCandidate`'s module centre in face-local metres when the engine resolves the declared physical-module pattern deterministically.
   */
  center: IAutoMoviePatternPoint;
  /**
   * Module footprint in metres; the joint is the gap the author leaves.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `size` records `IAutoMoviePatternCandidate`'s module footprint in metres; the joint is the gap the author leaves. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `size` supplies `IAutoMoviePatternCandidate`'s module footprint in metres; the joint is the gap the author leaves when the engine resolves the declared physical-module pattern deterministically.
   */
  size: {
    /** Module extent along its own long axis before rotation, in metres. */
    u: number;
    /** Module extent across that axis before rotation, in metres. */
    v: number;
  };
  /**
   * In-plane module rotation in degrees, counter-clockwise about the normal.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `rotationDeg` records `IAutoMoviePatternCandidate`'s in-plane module rotation in degrees, counter-clockwise about the normal. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `rotationDeg` supplies `IAutoMoviePatternCandidate`'s in-plane module rotation in degrees, counter-clockwise about the normal when the engine resolves the declared physical-module pattern deterministically.
   */
  rotationDeg: number;
  /**
   * Material grain direction in degrees; read modulo 180.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `grainDeg` records `IAutoMoviePatternCandidate`'s material grain direction in degrees; read modulo 180. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `grainDeg` supplies `IAutoMoviePatternCandidate`'s material grain direction in degrees; read modulo 180 when the engine resolves the declared physical-module pattern deterministically.
   */
  grainDeg: number;
  /**
   * Whether the piece is laid face-flipped, its own U axis reversed.
   *
   * This is what book-matching is: two slabs cut from one block and opened like
   * a page, so the second shows the first's image reversed. A rectangle is
   * unchanged by that flip, so the piece keeps the same footprint and the same
   * instance slot; what reverses is the material across it, which is why the
   * flip only becomes visible through
   * {@link autoMoviePatternTextureTransforms}.
   *
   * It is not the grain turned. {@link grainDeg} states the direction the grain
   * runs on the surface either way, so a mirrored pair whose grain runs one way
   * is continuous grain and is not reported as a break.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `mirror` records whether the piece is laid face-flipped, its own U axis reversed for `IAutoMoviePatternCandidate`. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `mirror` tells the engine whether the piece is laid face-flipped, its own U axis reversed for `IAutoMoviePatternCandidate` as it resolves the declared physical-module pattern deterministically.
   */
  mirror: boolean;
}
