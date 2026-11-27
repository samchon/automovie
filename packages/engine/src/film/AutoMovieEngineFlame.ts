import { type IAutoMovieFlameCue, type IAutoMoviePerformShotProps, type IAutoMovieSceneNode, type IAutoMovieViolationCollector, type IAutoMovieColor, type IAutoMovieMesh } from "@automovie/interface";
import { admitPerformShotFlames as admitPerformShotFlamesImplementation } from "./flame/internal/admitPerformShotFlames";
import { blackbodyAutoMovieColor as blackbodyAutoMovieColorImplementation } from "./flame/internal/blackbodyAutoMovieColor";
import { compileAutoMovieFlameFlicker as compileAutoMovieFlameFlickerImplementation } from "./flame/internal/compileAutoMovieFlameFlicker";
import { heskestadFlameHeight as heskestadFlameHeightImplementation } from "./flame/internal/heskestadFlameHeight";
import { puffingFrequency as puffingFrequencyImplementation } from "./flame/internal/puffingFrequency";
import { sampleAutoMovieFlame as sampleAutoMovieFlameImplementation } from "./flame/internal/sampleAutoMovieFlame";

/** Public operations for Auto Movie Engine Flame. */
export namespace AutoMovieEngineFlame {
  /**
   * Admit a shot's flame cues against the staged nodes, the registered models and
   * the shot's practical light bindings, and return detached copies.
   *
   * {@link appendFlamesArtifact} checks each cue with the models and bindings the
   * props hold: an id unique in the shot, a staged node whose model is
   * registered, an emitter that is a fixed affordance of that model, a
   * nonnegative safe-integer seed and a positive finite size. An open fire also
   * needs a positive Heskestad height and a diameter of at least 0.04 m. An `on`
   * interval is `0 <= start < end <= duration`. `light` names a binding of this
   * shot on the same node and emitter, burning over the same interval, which no
   * other cue names; `emission` is present exactly when `light` is absent, with a
   * positive finite luminance and a valid colour. Findings join `out` under
   * `$input.flames`; on any finding, including an earlier gate's, the result is
   * absent.
   */
  export function admitPerformShotFlames(props: Pick<
    IAutoMoviePerformShotProps,
    "flames" | "models" | "practicalLights"
  >, nodes: readonly IAutoMovieSceneNode[], duration: number, out: IAutoMovieViolationCollector): IAutoMovieFlameCue[] | undefined {
    return admitPerformShotFlamesImplementation(props, nodes, duration, out);
  }

  /**
   * Linear sRGB colour of a blackbody at `kelvin`, scaled so its largest channel
   * is 1, for a flame light's colour.
   *
   * Planck's spectral radiance `λ^−5 / (exp(c2 / (λ T)) − 1)`, with the second
   * radiation constant `c2 = hc / k = 1.438777e-2 m·K` (CODATA 2018) and its
   * constant factor dropped because the result is normalized, is weighted by the
   * CIE 1931 2° colour-matching functions in the multi-lobe piecewise Gaussian
   * fit of Wyman, Sloan and Shirley ("Simple analytic approximations to the CIE
   * XYZ color matching functions", JCGT 2(2), 2013, equation 2), at every
   * nanometre from 360 to 830 nm. The tristimulus values are converted with the
   * IEC 61966-2-1 XYZ to linear sRGB matrix. A channel below zero, a chromaticity
   * outside the sRGB gamut, is clamped to zero before scaling.
   *
   * @throws {RangeError} When `kelvin` is not finite and positive.
   */
  export function blackbodyAutoMovieColor(kelvin: number): IAutoMovieColor {
    return blackbodyAutoMovieColorImplementation(kelvin);
  }

  /**
   * The key grid and silhouette areas a flame cue's bound light flickers by.
   *
   * Keys fall at every multiple of 1/120 s in [0, duration], plus the duration
   * and the cue's `on` start and end, merged where they coincide. The grid does
   * not depend on the render's frame rate; 1/120 s divides the frame period of
   * 12, 24, 30 and 60 fps, and gives at least 16 keys per flicker period up to
   * 7.5 Hz, the limit flame admission enforces. `areas[i]` is the flame's
   * silhouette area at `times[i]` from `sampleAutoMovieFlame`. `mean` is Ā, the
   * mean area over the keys inside `on`, or over every key when `on` is omitted;
   * a light whose key inside `on` holds `I_on · A / Ā` therefore averages exactly
   * `I_on` over those keys, and the flame's luminance is `I_on / Ā` in cd/m².
   */
  export function compileAutoMovieFlameFlicker(cue: Pick<IAutoMovieFlameCue, "id" | "seed" | "size" | "on">, duration: number): {
  /** Strictly increasing key times, seconds. */
  times: number[];

  /** Silhouette area at each key, square metres. */
  areas: number[];

  /** Whether each key lies inside the cue's `[start, end)` interval. */
  inside: boolean[];

  /** Mean area over the keys inside the interval, square metres. */
  mean: number;
} {
    return compileAutoMovieFlameFlickerImplementation(cue, duration);
  }

  /**
   * Heskestad's mean luminous flame height of a turbulent diffusion flame, `L =
   * 0.235 Q^(2/5) − 1.02 D`, in metres, for a heat release rate `Q` in kW over a
   * fuel bed of diameter `D` in metres (Heskestad, "Luminous heights of turbulent
   * diffusion flames", Fire Safety Journal 5, 1983).
   *
   * The correlation is fitted to pool and burner fires; it can come out zero or
   * negative for a small fire on a wide bed (5 kW on 0.5 m gives −0.063 m), which
   * flame admission refuses rather than drawing.
   */
  export function heskestadFlameHeight(heatRelease: number, diameter: number): number {
    return heskestadFlameHeightImplementation(heatRelease, diameter);
  }

  /**
   * Puffing frequency of a buoyant pool fire, `f = 1.5 D^(−1/2)` in hertz for a
   * fuel bed of diameter `D` in metres (Cetegen and Ahmed, "Experiments on the
   * periodic instability of buoyant plumes and pool fires", Combustion and Flame
   * 93, 1993): 0.5 m gives 2.12 Hz.
   */
  export function puffingFrequency(diameter: number): number {
    return puffingFrequencyImplementation(diameter);
  }

  /**
   * The shape of a flame cue at shot-local `seconds`: its surface mesh in the
   * emitter frame (`+Y` up the flame) and its silhouette area.
   *
   * Every value is a closed form of `seconds` and the cue, with no state between
   * samples, so any order of sampling gives the same flame.
   *
   * - `small`: a closed meridian `r0(s) = R · s^0.5 (1 − s)^1.2 / m` over `s = h /
   *   H` in [0, 1], normalized by its maximum `m` so the widest radius is `R`,
   *   displaced by `1 + 0.08 · n(3 s − 2 t, 0)` where `n` is the cue's seeded
   *   gradient noise (Perlin, "Improving noise", ACM TOG 21(3), 2002). The noise
   *   domain falls with time, so features travel up the flame. The tip sways
   *   sideways by `0.1 H` times noise read at 2 Hz, bending each ring in
   *   proportion to `s²`. An isolated candle flame burns steadily in still air
   *   (Kitahata et al., "Oscillation and synchronization in the combustion of
   *   candles", J. Phys. Chem. A 113, 2009), so a small flame does not pulse;
   *   treating lighter, torch and lantern flames the same way is a provisional
   *   choice, as are the 8 %, 10 % and 2 Hz amounts.
   * - `open`: Heskestad's luminous height `L` from the heat release and the
   *   diameter, pulsing as `L (1 + 0.25 sin(2π f t + φ))` at the puffing
   *   frequency `f = 1.5 D^(−1/2)` (Cetegen and Ahmed 1993) with a seeded phase
   *   `φ`, over a meridian `r0(s) = (D/2)(1 − s)^0.8` displaced by 15 % noise
   *   travelling up at `f` cells per second; the 25 % and 15 % depths are
   *   provisional estimates.
   * - `ember`: a flat disc of the cue's radius facing `+Y`, whose glow factor `1 +
   *   0.1 n(2 t)` varies at 2 Hz.
   *
   * The silhouette area is twice the integral of the displaced meridian radius
   * over height, by the trapezoid rule on the same samples the mesh revolves, for
   * a flame, and the disc's area times its glow factor for an ember.
   */
  export function sampleAutoMovieFlame(cue: Pick<IAutoMovieFlameCue, "id" | "seed" | "size">, seconds: number): { mesh: IAutoMovieMesh; area: number } {
    return sampleAutoMovieFlameImplementation(cue, seconds);
  }
}
