import type {
  IAutoMovieProductionFrameRate,
  IAutoMovieProductionVideoProbe,
} from "@automovie/interface";

/**
 * The exact H.264-in-MP4 picture profile one video deliverable must carry,
 * resolved from its authored raster and frame rate.
 *
 * `resolveProductionVideoProfile` builds it, and `assertProductionVideoProfile`
 * refuses a probed file that differs from it. Raster and rate vary per
 * deliverable; brands, matrix, pixel aspect and color are fixed literals of the
 * one profile the normalizer writes.
 *
 * @evidence contracts/development/design.md#principled-representation The profile states facts in the MP4 file's own terms, such as ISO brands, the 16.16 and 2.30 fixed-point track matrix and ITU-T H.273 color code points, so the checker compares them directly with the probe without unit conversion.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only the facts the checker needs from the author are variable, and container and codec identity stay inside the checker because no profile may differ there.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The literal color code points and brand are the sRGB and ISO base media identities the normalizer writes, shared through `AUTOMOVIE_MP4_SRGB_COLOUR` and the unity matrix constant, not values picked for a test file.
 * @evidence contracts/development/common.md#meaningful-documentation The prose names producer and checker and which fields vary; each member gives its unit, fixed-point form or code-point meaning.
 */
export interface IAutoMovieProductionVideoProfile {
  /** Coded and displayed picture width in pixels. */
  width: number;

  /** Coded and displayed picture height in pixels. */
  height: number;

  /** Exact rational picture rate the sample timing must equal. */
  frameRate: IAutoMovieProductionFrameRate;

  /**
   * Major brand, and the brands the file's compatible-brand list must
   * include; other compatible brands are allowed.
   */
  brands: { major: "isom"; requiredCompatible: readonly string[] };

  /** Track display matrix in 16.16 and 2.30 fixed point; the unity matrix. */
  trackMatrix: IAutoMovieProductionVideoProbe["trackMatrix"];

  /** Pixel aspect; the profile admits square pixels only. */
  pixelAspect: "square";

  /**
   * ITU-T H.273 color code points the track's `nclx` color box must declare:
   * BT.709 primaries (1), sRGB transfer (13), BT.709 matrix (1), and full
   * range.
   */
  color: { primaries: 1; transfer: 13; matrix: 1; fullRange: true };
}
