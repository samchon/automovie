import { incidentEv100 as incidentEv100Implementation } from "./exposure/internal/incidentEv100";
import { type IAutoMovieCheckExposureContinuity, type IAutoMovieMeterIlluminance } from "@automovie/interface";
import { checkExposureContinuity as checkExposureContinuityImplementation } from "./exposure/internal/checkExposureContinuity";
import { meterIlluminance as meterIlluminanceImplementation } from "./exposure/internal/meterIlluminance";

/** Public operations for Auto Movie Engine Exposure. */
export namespace AutoMovieEngineExposure {
  /**
   * The exposure value at ISO 100 an incident-light meter sets for an
   * illuminance: `log2(lux × 100 / 250)`, the incident-light meter equation of
   * ISO 2720:1974, `EV = log2(E × S / C)`, at speed `S = 100` with calibration
   * constant `C = 250`.
   *
   * With the saturation-based exposure of `IAutoMovieFilmOptics.ev100`, which
   * scales luminance by `1 / (1.2 × 2^ev100)`, an 18 % grey Lambert card under
   * that illuminance has luminance `0.18 × lux / π` and renders at `0.18 × 250 /
   * (100 × 1.2 × π) = 0.1194` linear before the tone curve, at any light level.
   *
   * @param lux Metered illuminance in lux; finite and above zero.
   * @returns EV100, in stops.
   * @throws Error when `lux` is not finite and above zero, which no meter can set
   *   an exposure for.
   */
  export function autoMovieIncidentEv100(lux: number): number {
    return incidentEv100Implementation(lux);
  }

  /**
   * Report every cut whose exposure jumps from the previous cut of the same
   * screenplay scene.
   *
   * Cuts are read in the given order, which is the film's playing order. Each cut
   * is compared with the most recent earlier cut of its `group`, so a cut of
   * another location between them is skipped; a finding is made when the two
   * EV100 values differ by more than `tolerance` stops, unless the later cut sets
   * `change: true`, the screenplay's own decision. Every cut, reported or not,
   * becomes the reference for the next cut of its group. The first cut of a group
   * has nothing to compare with.
   *
   * The default tolerance is one third of a stop, the finest step of the exposure
   * scales cameras mark.
   *
   * @param props The cuts in playing order and the tolerance.
   * @returns One finding per reported cut, in playing order.
   * @throws Error when two cuts share an `index`, an index is not a safe integer,
   *   an `ev100` is not finite, or the tolerance is negative or not finite.
   */
  export function checkAutoMovieExposureContinuity(props: IAutoMovieCheckExposureContinuity.IProps): IAutoMovieCheckExposureContinuity.IFinding[] {
    return checkExposureContinuityImplementation(props);
  }

  /**
   * Meter the illuminance at a point of a scene, as an incident-light meter held
   * there facing `normal` would read the light the beauty pass draws.
   *
   * Each light contributes its photometric intensity times the Rec. 709 luma of
   * its linear colour, `0.2126 r + 0.7152 g + 0.0722 b`, since the pass scales
   * every channel by the colour; a white light contributes its intensity. With
   * `l` the unit direction from the point toward the light and `n` the unit
   * normal:
   *
   * - Directional: `I × max(0, n·l)`, where `l` is against the light's local -Z;
   * - Point: `I × max(0, n·l) / max(d², 0.01)`, times the range window `clamp(1 −
   *   (d / range)⁴, 0, 1)²` when `range > 0`, the falloff the beauty pass
   *   applies;
   * - Spot: the point term while the point lies strictly inside `coneAngle` of the
   *   light's local -Z, and zero outside, since the pass draws the cone with no
   *   penumbra;
   * - Area: the panel's luminance times the projected solid angle of the panel, `½
   *   Σ Θᵢ (n · Γᵢ)` over its edges by Lambert's polygon formula (Arvo 1995,
   *   "Applications of irradiance tensors to the simulation of non-Lambertian
   *   phenomena", SIGGRAPH), after clipping the panel to the half-space above the
   *   measured plane. The panel lies in its local XY plane, emits toward its
   *   local -Z only, and its transform's scale is not read, as the beauty pass
   *   reads only its rotation.
   *
   * Light terms are unoccluded: no shadow or solid is tested. Image lighting is
   * listed as unmetered with no value, since an environment's intensity has no
   * photometric unit. A daylight instant's sky is listed as unmetered with its
   * `DHI × V` value from `skyIlluminance` over the context's occluders;
   * its beam is never added, because the frame draws the sun only as a staged
   * directional light, which is already one of `lights`.
   *
   * @param props Lights, point, normal, environment and daylight.
   * @returns The total, one contribution per light and the unmetered sources.
   * @throws Error when the point is not finite or the normal is zero or not
   *   finite.
   */
  export function meterAutoMovieIlluminance(props: IAutoMovieMeterIlluminance.IProps): IAutoMovieMeterIlluminance.IResult {
    return meterIlluminanceImplementation(props);
  }
}
