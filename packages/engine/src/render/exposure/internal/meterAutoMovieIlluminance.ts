import type {
  IAutoMovieAreaLight,
  IAutoMovieLight,
  IAutoMovieMeterIlluminance,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { autoMovieContextSolids } from "../../../analysis/internal/autoMovieContextSolids";
import { autoMovieSkyIlluminance } from "../../../analysis/internal/autoMovieSkyIlluminance";
import { Quaternion } from "../../../math/Quaternion";
import { Vector3 } from "../../../math/Vector3";

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
 * `DHI × V` value from `autoMovieSkyIlluminance` over the context's occluders;
 * its beam is never added, because the frame draws the sun only as a staged
 * directional light, which is already one of `lights`.
 *
 * @param props Lights, point, normal, environment and daylight.
 * @returns The total, one contribution per light and the unmetered sources.
 * @throws Error when the point is not finite or the normal is zero or not
 *   finite.
 */
export function meterAutoMovieIlluminance(
  props: IAutoMovieMeterIlluminance.IProps,
): IAutoMovieMeterIlluminance.IResult {
  const { point }: IAutoMovieMeterIlluminance.IProps = props;
  const length: number = Vector3.length(props.normal);
  if (!(length > 0))
    throw new Error(
      "meterAutoMovieIlluminance: normal must be finite and non-zero.",
    );
  const normal: IAutoMovieVector3 = Vector3.scale(props.normal, 1 / length);

  const contributions: IAutoMovieMeterIlluminance.IContribution[] =
    props.lights.map(
      (light: IAutoMovieLight): IAutoMovieMeterIlluminance.IContribution => ({
        light: light.id,
        lux:
          light.intensity *
          (0.2126 * light.color.r +
            0.7152 * light.color.g +
            0.0722 * light.color.b) *
          incidence(light, point, normal),
      }),
    );

  const unmetered: IAutoMovieMeterIlluminance.IUnmetered[] = [];
  if (
    props.environment !== undefined &&
    props.environment !== null &&
    props.environment.image !== null
  )
    unmetered.push({ source: "environmentImage", lux: null });
  if (props.daylight !== undefined)
    unmetered.push({
      source: "daylightSky",
      lux: autoMovieSkyIlluminance({
        normal,
        ground: props.daylight.context.ground,
        count: props.daylight.diffuseSamples,
        illuminance: props.daylight.instant.diffuseHorizontalIlluminance,
        solids: autoMovieContextSolids(props.daylight.context),
      })(point),
    });

  return {
    lux: contributions.reduce(
      (sum: number, entry: IAutoMovieMeterIlluminance.IContribution): number =>
        sum + entry.lux,
      0,
    ),
    contributions,
    unmetered,
  };
}

/** A light's local -Z, its direction of travel. */
const FORWARD: IAutoMovieVector3 = { x: 0, y: 0, z: -1 };

/**
 * Smallest squared distance the beauty pass divides by, in square metres: the
 * renderer's punctual falloff is `1 / max(d², 0.01)`, so a light nearer than
 * 0.1 m does not grow without bound.
 */
const NEAREST_SQUARED: number = 0.01;

/**
 * The geometric factor that turns a light's photometric intensity into
 * illuminance at the point: the cosine for a directional light, the windowed
 * inverse square law for point and spot lights, and the projected solid angle
 * for an area panel.
 */
const incidence: (
  light: IAutoMovieLight,
  point: IAutoMovieVector3,
  normal: IAutoMovieVector3,
) => number = (
  light: IAutoMovieLight,
  point: IAutoMovieVector3,
  normal: IAutoMovieVector3,
): number => {
  const forward: IAutoMovieVector3 = Quaternion.rotateVector(
    light.transform.rotation,
    FORWARD,
  );
  if (light.type === "directional")
    return Math.max(0, -Vector3.dot(normal, Vector3.normalize(forward)));
  if (light.type === "area") return projectedSolidAngle(light, point, normal);

  const offset: IAutoMovieVector3 = Vector3.subtract(
    light.transform.translation,
    point,
  );
  const squared: number = Vector3.dot(offset, offset);
  if (squared === 0) return 0;
  const distance: number = Math.sqrt(squared);
  const toward: IAutoMovieVector3 = Vector3.scale(offset, 1 / distance);
  if (light.type === "spot") {
    const axis: number = -Vector3.dot(toward, Vector3.normalize(forward));
    if (!(axis > Math.cos((light.coneAngle * Math.PI) / 180))) return 0;
  }
  const window: number =
    light.range > 0
      ? Math.min(1, Math.max(0, 1 - (distance / light.range) ** 4)) ** 2
      : 1;
  return (
    (Math.max(0, Vector3.dot(normal, toward)) * window) /
    Math.max(squared, NEAREST_SQUARED)
  );
};

/**
 * The projected solid angle of an area panel seen from the point, clipped to
 * the half-space above the measured plane: the factor that multiplies the
 * panel's luminance to give illuminance (Lambert's polygon formula, after Arvo
 * 1995). Zero behind the panel's emitting face.
 */
const projectedSolidAngle: (
  light: IAutoMovieAreaLight,
  point: IAutoMovieVector3,
  normal: IAutoMovieVector3,
) => number = (
  light: IAutoMovieAreaLight,
  point: IAutoMovieVector3,
  normal: IAutoMovieVector3,
): number => {
  const rotation: IAutoMovieQuaternion = light.transform.rotation;
  const centre: IAutoMovieVector3 = light.transform.translation;
  const front: IAutoMovieVector3 = Quaternion.rotateVector(rotation, FORWARD);
  if (Vector3.dot(Vector3.subtract(point, centre), front) <= 0) return 0;

  const across: IAutoMovieVector3 = Vector3.scale(
    Quaternion.rotateVector(rotation, { x: 1, y: 0, z: 0 }),
    light.width / 2,
  );
  const up: IAutoMovieVector3 = Vector3.scale(
    Quaternion.rotateVector(rotation, { x: 0, y: 1, z: 0 }),
    light.height / 2,
  );

  // Corners relative to the point, in order around the panel.
  const corners: IAutoMovieVector3[] = [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ].map(
    ([u, v]: number[]): IAutoMovieVector3 =>
      Vector3.subtract(
        Vector3.add(
          centre,
          Vector3.add(Vector3.scale(across, u!), Vector3.scale(up, v!)),
        ),
        point,
      ),
  );
  const clipped: IAutoMovieVector3[] = clipAbove(corners, normal);

  // Lambert's formula: each edge subtends angle Θ about the unit normal Γ of
  // the plane through the point and the edge; the sum is signed by winding, so
  // its magnitude is taken.
  let sum: number = 0;
  for (let i: number = 0; i < clipped.length; ++i) {
    const a: IAutoMovieVector3 = clipped[i]!;
    const b: IAutoMovieVector3 = clipped[(i + 1) % clipped.length]!;
    const cross: IAutoMovieVector3 = Vector3.cross(a, b);
    const sine: number = Vector3.length(cross);
    if (sine === 0) continue;
    const angle: number = Math.atan2(sine, Vector3.dot(a, b));
    sum += (angle * Vector3.dot(cross, normal)) / sine;
  }
  return Math.abs(sum) / 2;
};

/**
 * Clip a polygon, given as vectors from the point, to the half-space where
 * `dot(v, normal) >= 0` (Sutherland and Hodgman 1974, "Reentrant polygon
 * clipping", CACM).
 */
const clipAbove: (
  polygon: readonly IAutoMovieVector3[],
  normal: IAutoMovieVector3,
) => IAutoMovieVector3[] = (
  polygon: readonly IAutoMovieVector3[],
  normal: IAutoMovieVector3,
): IAutoMovieVector3[] => {
  const output: IAutoMovieVector3[] = [];
  for (let i: number = 0; i < polygon.length; ++i) {
    const current: IAutoMovieVector3 = polygon[i]!;
    const next: IAutoMovieVector3 = polygon[(i + 1) % polygon.length]!;
    const here: number = Vector3.dot(current, normal);
    const there: number = Vector3.dot(next, normal);
    if (here >= 0) output.push(current);
    if (here >= 0 !== there >= 0) {
      const t: number = here / (here - there);
      output.push(
        Vector3.add(current, Vector3.scale(Vector3.subtract(next, current), t)),
      );
    }
  }
  return output;
};
