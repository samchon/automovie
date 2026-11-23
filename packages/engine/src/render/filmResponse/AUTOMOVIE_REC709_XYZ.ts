/**
 * The linear Rec. 709 (sRGB primaries, D65 white) to CIE 1931 XYZ matrix and
 * its inverse, row-major, for colours whose white has luminance Y = 1.
 *
 * Values are the ones IEC 61966-2-1:1999 derives from the Rec. 709 primaries
 * (ITU-R BT.709-6) and the D65 white, to seven decimals; the renderer's working
 * colour space is this linear space, so a matrix built from these maps the
 * beauty pass's linear values.
 */
export const AUTOMOVIE_REC709_XYZ: {
  /** Linear Rec. 709 RGB to XYZ. */
  readonly toXyz: readonly number[];

  /** XYZ to linear Rec. 709 RGB. */
  readonly fromXyz: readonly number[];
} = {
  toXyz: [
    0.4124564, 0.3575761, 0.1804375, 0.2126729, 0.7151522, 0.072175, 0.0193339,
    0.119192, 0.9503041,
  ],
  fromXyz: [
    3.2404542, -1.5371385, -0.4985314, -0.969266, 1.8760108, 0.041556,
    0.0556434, -0.2040259, 1.0572252,
  ],
};
