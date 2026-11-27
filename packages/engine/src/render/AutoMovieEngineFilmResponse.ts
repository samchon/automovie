import { type IAutoMovieFilmOptics, type IAutoMoviePlanFilmSamples } from "@automovie/interface";
import { autoMovieFilmResponseMatrix as autoMovieFilmResponseMatrixImplementation } from "./filmResponse/internal/autoMovieFilmResponseMatrix";
import { autoMoviePlanckianWhite as autoMoviePlanckianWhiteImplementation } from "./filmResponse/internal/autoMoviePlanckianWhite";
import { planAutoMovieFilmSamples as planAutoMovieFilmSamplesImplementation } from "./filmResponse/internal/planAutoMovieFilmSamples";
import { respondAutoMovieFilmColor as respondAutoMovieFilmColorImplementation } from "./filmResponse/internal/respondAutoMovieFilmColor";

/** Public operations for Auto Movie Engine Film Response. */
export namespace AutoMovieEngineFilmResponse {
  /**
   * The linear part of a film's camera response, as one row-major 3 × 3 matrix
   * applied to linear Rec. 709 scene values: the exposure scale times the white
   * balance.
   *
   * The exposure scale is `1 / (1.2 × 2^ev100)`, the saturation-based mapping of
   * ISO 12232:2019 with its 78 / (100 × 0.65) factor written as 1.2. With a
   * `whiteBalance`, the matrix also maps the Planckian white of that temperature
   * ({@link autoMoviePlanckianWhite}) to the D65 working white by complete von
   * Kries adaptation in the CAT02 cone space (CIE 159:2004): `RGB ← XYZ · CAT02⁻¹
   * · diag(LMS_D65 / LMS_K) · CAT02 · XYZ ← RGB`. Both whites have unit
   * luminance, so a neutral surface keeps its luminance when it is balanced.
   *
   * Exposure and white balance are both linear, and so is the glare that follows
   * them in the final pass, so the final pass applies this one matrix to the
   * scene value and to its glare alike. The caller admits `optics` first; an
   * out-of-range temperature throws from {@link autoMoviePlanckianWhite}.
   */
  export function autoMovieFilmResponseMatrix(optics: Pick<IAutoMovieFilmOptics, "ev100" | "whiteBalance">): number[] {
    return autoMovieFilmResponseMatrixImplementation(optics);
  }

  /**
   * The colour of a black body at `kelvin`, as linear Rec. 709 RGB with luminance
   * Y = 1: the light colour a tungsten lamp, a candle or daylight of that
   * temperature casts, and the white that `IAutoMovieFilmOptics.whiteBalance`
   * adapts away.
   *
   * The chromaticity is the cubic approximation of the Planckian locus by Kim et
   * al. (2002), whose coefficients cover 1667 K to 25000 K; the result is mapped
   * from XYZ by {@link AUTOMOVIE_REC709_XYZ}. Saturated low temperatures leave the
   * Rec. 709 gamut slightly, so a channel may be a little below zero; it is
   * returned as computed, because clamping it would change the white the balance
   * adapts.
   *
   * Throws when `kelvin` is not finite or lies outside [1667, 25000], the
   * approximation's range.
   */
  export function autoMoviePlanckianWhite(kelvin: number): [number, number, number] {
    return autoMoviePlanckianWhiteImplementation(kelvin);
  }

  /**
   * Plan the sub-frame samples a directly rendered frame averages with equal
   * weight: when each is placed and where on the aperture its eye sits.
   *
   * For `N = optics.samples`, sample `k = 0 … N − 1` takes:
   *
   * - Its second: with a shutter, `t − T × (N − k − 0.5) / N`, the midpoints of `N`
   *   equal strata of the trailing interval `[t − T, t]` with `T = angle / 360 /
   *   fps`, in ascending time, so the frame's last placement, its marks and its
   *   pose sidecar all describe second `t`; without a shutter, `t`;
   * - Its eye: with a lens, point `j` of the Hammersley set `(j / N, Φ₂(j))`, `Φ₂`
   *   the base-2 radical inverse, mapped to the unit disk by the concentric map
   *   of Shirley and Chiu (1997, "A low distortion map between disk and square",
   *   Journal of Graphics Tools) and scaled to the aperture radius. Alone, `j =
   *   k`. With a shutter too, `j = (a × k + ⌊N / 2⌋) mod N`, with `a` the integer
   *   nearest `N × 0.618…` that is coprime to `N`: a fixed permutation other than
   *   the identity, so a sample's time and its lens position are not correlated
   *   (Cook, Porter and Carpenter 1984, "Distributed ray tracing", SIGGRAPH).
   *
   * The aperture diameter is the full-frame equivalent focal length of the
   * camera's field of view, `12 mm / tan(fovY / 2)`, divided by the f-number, so
   * the blur matches the picture's geometry rather than an authored focal length.
   * Every value depends only on `t`, `fps`, the optics and `fovY`, never on an
   * earlier frame.
   *
   * @param props The frame's second, the frame rate, the optics and the field of
   *   view.
   * @returns `samples` samples in drawing order.
   * @throws Error when the optics has no `samples`, or `fps` or `fovY` is out of
   *   range.
   */
  export function planAutoMovieFilmSamples(props: IAutoMoviePlanFilmSamples.IProps): IAutoMoviePlanFilmSamples.ISample[] {
    return planAutoMovieFilmSamplesImplementation(props);
  }

  /**
   * The CPU reference of a film's camera response for one pixel whose glare is
   * already summed in: the encoded and graded value the final pass writes before
   * quantization.
   *
   * Steps, in the final pass's order without its spatial glare step:
   *
   * 1. Exposure and white balance by {@link autoMovieFilmResponseMatrix};
   * 2. The tone curve: `"none"` passes the value on, and `"acesFilmic"` is the
   *    renderer's fit of the ACES reference rendering and output transforms,
   *    `saturate(Out · RRTAndODT(In · c / 0.6))` with its input and output
   *    matrices and rational fit written out below;
   * 3. Clamping to [0, 1], since the 8-bit output stores nothing outside it and the
   *    encoding is undefined below zero;
   * 4. The sRGB output encoding of IEC 61966-2-1: `12.92 c` up to 0.0031308, else
   *    `1.055 c^(1/2.4) − 0.055`;
   * 5. With a `grade`, the ASC CDL v1.2 operators: `clamp(c × slope + offset, 0,
   *    1)^power` per channel, then `luma + saturation × (c − luma)` with Rec. 709
   *    luma weights (0.2126, 0.7152, 0.0722).
   *
   * The result is not clamped after the grade; the canvas clamps it when it
   * quantizes. `color` is linear Rec. 709 scene light in nits, red, green and
   * blue. The caller admits `optics` first.
   */
  export function respondAutoMovieFilmColor(props: {
  /** Linear scene value, nits per channel. */
  color: readonly [number, number, number];

  /** The film's optics at the drawn second. */
  optics: IAutoMovieFilmOptics;
}): [number, number, number] {
    return respondAutoMovieFilmColorImplementation(props);
  }
}
