import type { AutoMovieProductionPngRole } from "./AutoMovieProductionPngRole.js";

/**
 * The exact PNG picture facts the deterministic writers emit for one role.
 *
 * `resolveProductionPngProfile` builds it, and `assertProductionPngPicture`
 * refuses a parsed PNG that differs in any compared field. Every field except
 * the raster is a single literal, because the writers support exactly one
 * format.
 */
export interface IAutoMovieProductionPngProfile {
  /** Profile schema version. */
  version: 1;

  /** Renderer-owned role the PNG is written for, named in a mismatch error. */
  role: AutoMovieProductionPngRole;

  /** Stored image width in pixels. */
  width: number;

  /** Stored image height in pixels. */
  height: number;

  /** Bits per channel; every writer emits 8. */
  bitDepth: 8;

  /** Channel layout; every writer emits RGBA. */
  color: "rgba";

  /** Alpha convention: color channels are not premultiplied by alpha. */
  alpha: "straight";

  /** Interlace method; the writers never interlace. */
  interlace: "none";

  /** Color space the pixel values are display-referred in. */
  colorSpace: "srgb";

  /**
   * Pixel aspect; the writers emit square pixels, and a PNG without a physical
   * pixel ratio is read as square.
   */
  pixelAspect: "square";

  /** Stored orientation; the writers never rotate. */
  orientation: "upright";
}
