import type { IAutoMovieProductionFrameRate } from "../production/IAutoMovieProductionFrameRate.js";
import type { IAutoMovieProductionVideoProbe } from "../production/IAutoMovieProductionVideoProbe.js";

/**
 * The exact H.264-in-MP4 picture profile one video deliverable must carry,
 * resolved from its authored raster and frame rate.
 *
 * `resolveProductionVideoProfile` builds it, and `assertProductionVideoProfile`
 * refuses a probed file that differs from it. Raster and rate vary per
 * deliverable; brands, matrix, pixel aspect and color are fixed literals of the
 * one profile the normalizer writes.
 */
export interface IAutoMovieProductionVideoProfile {
  /** Coded and displayed picture width in pixels. */
  width: number;

  /** Coded and displayed picture height in pixels. */
  height: number;

  /** Exact rational picture rate the sample timing must equal. */
  frameRate: IAutoMovieProductionFrameRate;

  /**
   * Major brand, and the brands the file's compatible-brand list must include;
   * other compatible brands are allowed.
   */
  brands: {
    /** Required MP4 major brand. */
    major: "isom";
    /** Compatible brands that must be present; extra brands are allowed. */
    requiredCompatible: readonly string[];
  };

  /** Track display matrix in 16.16 and 2.30 fixed point; the unity matrix. */
  trackMatrix: IAutoMovieProductionVideoProbe["trackMatrix"];

  /** Pixel aspect; the profile admits square pixels only. */
  pixelAspect: "square";

  /**
   * ITU-T H.273 color code points the track's `nclx` color box must declare:
   * BT.709 primaries (1), sRGB transfer (13), BT.709 matrix (1), and full
   * range.
   */
  color: {
    /** BT.709 primaries code point in the nclx declaration. */
    primaries: 1;
    /** SRGB transfer-characteristic code point. */
    transfer: 13;
    /** BT.709 matrix-coefficient code point. */
    matrix: 1;
    /** Encoded sample values use the complete integer code range. */
    fullRange: true;
  };
}
