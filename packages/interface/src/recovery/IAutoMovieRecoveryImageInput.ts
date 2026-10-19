/**
 * Resident RGB observations of one caller-declared fixed rigid object.
 * Known orthographic cameras look horizontally through the common XZ plane.
 * Pixel centres are (column + 0.5, row + 0.5); positive image U projects
 * cos(azimuth) X + sin(azimuth) Z and positive image V projects negative Y.
 * Supplied calibration fixes metric scale and object frame, not estimated cameras.
 *
 * @evidence contracts/common.md#principled-implementation Explicit metric orthographic charts and immutable byte identities distinguish supplied calibration from recovered geometry and permit corresponding physical rows without matching sliding apparent contours.
 * @evidence contracts/common.md#clear-and-simple-design This pure capture record contains resident pixels, camera provenance and the declared non-trained background test; fitting policy and saved coefficients belong to separate records.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts One asserted rigid object and one cohort identify the capture; no hidden camera estimation, learned mask, manual curve, resampling or mesh reference is represented.
 * @evidence contracts/common.md#meaningful-documentation Documents pixel centres, axis signs, millimetres, supplied calibration, RGB interpretation, byte provenance and borrowed-array lifetime.
 * @author Samchon
 */
export interface IAutoMovieRecoveryImageInput {
  /** Version of the known-camera RGB capture. */
  schema: "automovie-recovery-images-v1";

  /** Identity of the same fixed rigid object in all views. */
  objectId: string;

  /** Caller assertion; structural admission cannot verify physical rigidity. */
  rigidity: "asserted-fixed";

  /** Keep analytic truth, actual photographs and inconsistent-input results separate. */
  cohort: "analytic" | "photograph" | "inconsistent-stress";

  /** Common right-handed metric-frame identity. */
  frame: string;

  /** Fixed sRGB byte background; a maximum absolute channel distance at least the positive threshold, at most 255, marks foreground. */
  background: { rgb: [number, number, number]; threshold: number };

  /** Borrowed row-major RGB8 arrays, stable until synchronous observation returns. */
  views: {
    /** Unique capture/camera identity. */
    id: string;

    /** Original-byte SHA-256, asserted by resident callers and verified by the file host. */
    sourceSha256: string;

    /** Producer-declared external orientation, crop or rectification history. */
    pixelProvenance: string;

    /** Positive integer current pixel width. */
    width: number;

    /** Positive integer current pixel height. */
    height: number;

    /** Exactly 3 * width * height unsigned sRGB bytes, without alpha. */
    rgb8: Uint8Array;

    /** Supplied camera in this exact pixel chart. */
    camera: {
      /** Horizontal orthographic image formation; no perspective or distortion term is admitted. */
      type: "horizontal-orthographic";

      /** Calibration is a supplied input, never estimated by the image observer. */
      calibration: "supplied";

      /** Positive image-U direction in the XZ plane, radians from +X toward +Z. */
      azimuthRadians: number;

      /** Positive millimetres per square pixel. */
      pixelPitchMm: number;

      /** Pixel-edge coordinates [u0,v0] of the common metric-frame origin. */
      principalPointPx: [number, number];
    };
  }[];

  /** Positive integer total-pixel, view and retained-row limits checked before scans. */
  budget: { maxPixels: number; maxViews: number; maxRows: number };
}
