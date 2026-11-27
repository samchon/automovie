import type { IAutoMovieSceneEnvironment } from "../scene/IAutoMovieSceneEnvironment";

/**
 * The camera response of a directly rendered film at one second: how the linear
 * scene light the beauty pass draws becomes the delivered picture.
 *
 * A draw scene returns it from `optics` for every second it draws. The draw
 * host renders the beauty pass into a linear half-float target and one final
 * pass then applies, in order, the exposure, the white balance, the glare, the
 * tone curve, the sRGB output encoding and the grade, before the picture is
 * quantized into the 8-bit canvas. Structural passes (depth, normal, mask,
 * outline) ignore it.
 *
 * On the draw path this is the only response: the renderer's own curve and
 * exposure are held at none and one while the beauty pass draws.
 * {@link IAutoMovieSceneEnvironment.exposure} and
 * {@link IAutoMovieSceneEnvironment.toneMapping} keep governing the
 * compiled-scene pass, which has no linear target.
 */
export interface IAutoMovieFilmOptics {
  /**
   * Camera exposure value at ISO 100, finite.
   *
   * Linear scene luminance in nits is multiplied by `1 / (1.2 × 2^ev100)`, the
   * saturation-based mapping of ISO 12232:2019 with its 78 / (100 × 0.65)
   * factor written as 1.2, so a luminance of `1.2 × 2^ev100` nits reaches
   * display white before the curve. One stop more halves the picture.
   */
  ev100: number;

  /**
   * The tone curve applied after exposure, white balance and glare: `"none"`
   * clips linear values above one at the output encoding, and `"acesFilmic"` is
   * the renderer's fit of the ACES reference rendering and output transforms,
   * the curve the compiled-scene pass names the same way.
   */
  toneMapping: IAutoMovieSceneEnvironment["toneMapping"];

  /**
   * The scene white in kelvin, within [1667, 25000]: the colour temperature of
   * the light the camera is balanced for.
   *
   * The Planckian chromaticity of this temperature is adapted to the D65
   * working white by the CAT02 transform, so a neutral surface under a light of
   * this colour renders neutral. Absent applies no adaptation, as a camera
   * balanced for D65 daylight.
   */
  whiteBalance?: number;

  /** Veiling glare of the lens around bright sources. Absent spreads no light. */
  glare?: IAutoMovieFilmOptics.IGlare;

  /**
   * The adopted grade, as American Society of Cinematographers Color Decision
   * List v1.2 values applied to the encoded picture. Absent applies none; the
   * identity grade (slopes one, offsets zero, powers one, saturation one)
   * changes nothing.
   */
  grade?: IAutoMovieFilmOptics.IGrade;

  /**
   * The number of sub-frame samples the beauty pass averages with equal weight,
   * a safe integer of at least 2, required exactly when `shutter` or `lens` is
   * present.
   *
   * Sampling applies to delivery draws and to plain `beauty` captures; every
   * other draw, including the Viewer's, renders one sharp sample at the
   * second.
   */
  samples?: number;

  /**
   * The shutter: motion blur over the trailing interval `[t − T, t]` with `T =
   * angle / 360 / fps`, sampled at the midpoints of `samples` equal strata in
   * ascending time, each placed by the scene's `seek`. Absent draws every
   * sample at `t`.
   */
  shutter?: IAutoMovieFilmOptics.IShutter;

  /**
   * The lens's depth of field. Each sample moves the eye across the aperture
   * disk and shears the frustum so the plane at `focusDistance` projects
   * unchanged. The aperture diameter is the full-frame equivalent focal length
   * of the camera's field of view, `12 mm / tan(fovY / 2)`, divided by
   * `fNumber`. Absent keeps the eye at the camera centre. The film fills it
   * from `resolveLensAt`.
   */
  lens?: IAutoMovieFilmOptics.ILens;
}

/** The shutter, lens, glare and grade the optics state. */
export namespace IAutoMovieFilmOptics {
  /** The shutter that blurs motion within a frame. */
  export interface IShutter {
    /**
     * The shutter angle in degrees, within (0, 360]: the share of the frame
     * interval the shutter is open, 180 for half of it.
     */
    angle: number;
  }

  /** The lens stop and the focused distance of one second. */
  export interface ILens {
    /** The f-number, finite and above zero. */
    fNumber: number;

    /**
     * The focused depth in metres along the camera's forward axis, finite and
     * above zero.
     */
    focusDistance: number;
  }

  /**
   * How much of each pixel's light the lens spreads around it.
   *
   * The spread is a fixed sum of three Gaussian kernels whose standard
   * deviations are 0.002, 0.01 and 0.05 of the frame height, weighted 0.6, 0.3
   * and 0.1, a fixed approximation of a lens point-spread function. The output
   * is `(1 − strength) × input + strength × kernel ∗ input` in linear light,
   * which keeps the frame's total energy.
   */
  export interface IGlare {
    /** Fraction of each pixel's energy spread into glare, within [0, 0.2]. */
    strength: number;
  }

  /**
   * One ASC CDL v1.2 grade, applied per channel to encoded values clamped to
   * [0, 1] as `clamp(in × slope + offset, 0, 1)^power`, then saturation about
   * Rec. 709 luma (0.2126, 0.7152, 0.0722).
   *
   * Channels are red, green and blue in that order.
   */
  export interface IGrade {
    /** Finite per-channel gain. */
    slope: IAutoMovieFilmOptics.IChannels;

    /** Finite per-channel lift, in encoded units. */
    offset: IAutoMovieFilmOptics.IChannels;

    /** Per-channel exponent, finite and above zero. */
    power: IAutoMovieFilmOptics.IChannels;

    /**
     * Finite saturation: zero gives luma grey, one keeps the colour, above one
     * exaggerates it.
     */
    saturation: number;
  }

  /** Per-channel values, named in red, green, blue order. */
  export interface IChannels {
    /** Red channel. */
    r: number;
    /** Green channel. */
    g: number;
    /** Blue channel. */
    b: number;
  }
}
