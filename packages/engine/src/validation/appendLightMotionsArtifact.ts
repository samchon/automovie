import type {
  AutoMovieLightProperty,
  IAutoMovieClip,
  IAutoMovieClipChannelGate,
  IAutoMovieConstraintViolation,
  IAutoMovieLightChannelProperty,
  IAutoMovieLightPointer,
  IAutoMovieTrack,
} from "@automovie/interface";

import { cubicHermiteValue } from "../math/internal/cubicHermiteValue";
import { LIGHT_CHANNEL_PROPERTIES } from "../resolve/constants/LIGHT_CHANNEL_PROPERTIES";
import { parseLightPointer } from "../resolve/parseLightPointer";
import { channelValueWidth } from "./channelValueWidth";
import { lightClipChannelGate } from "./lightClipChannelGate";
import { pushViolation } from "./pushViolation";
import { validateClipArtifact } from "./validateClipArtifact";
import { validateRange } from "./internal/validateRange";
import { validateUniqueBy } from "./internal/validateUniqueBy";
import { validateUniqueIds } from "./validateUniqueIds";

/** Append light-clip target, uniqueness and range findings for a shot. */
export const appendLightMotionsArtifact: (
  lightMotions: readonly IAutoMovieClip[] | undefined,
  path: string,
  stagedLights: ReadonlyMap<string, unknown> | null,
  violations: IAutoMovieConstraintViolation[],
) => void = (
  lightMotions: readonly IAutoMovieClip[] | undefined,
  path: string,
  /**
   * The scene's light id → kind index, or `null` with no scene to check
   * against.
   */
  stagedLights: ReadonlyMap<string, unknown> | null,
  violations: IAutoMovieConstraintViolation[],
): void => {
  if (lightMotions === undefined) return;
  validateUniqueIds(lightMotions, path, "light motion clip id", violations);
  const gate: IAutoMovieClipChannelGate = lightClipChannelGate(stagedLights);
  const addressed: { id: string; path: string }[] = [];
  lightMotions.forEach((clip: IAutoMovieClip, i: number): void => {
    const clipPath: string = `${path}[${i}]`;
    validateClipArtifact(clip, clipPath, violations, gate);
    clip.tracks.forEach((track: IAutoMovieTrack, j: number): void => {
      const trackPath: string = `${clipPath}.tracks[${j}]`;
      const target: IAutoMovieLightPointer | null =
        track.channel.kind === "pointer"
          ? parseLightPointer(track.channel.pointer)
          : null;
      if (target === null) return;
      addressed.push({
        id: `${target.light}/${target.property}`,
        path: `${trackPath}.channel`,
      });
      appendLightValueBounds(track, target.property, trackPath, violations);
    });
  });
  validateUniqueBy(addressed, "light motion channel", violations);
};
/**
 * Every keyframe value of one light track, held to the property's own bounds:
 * the same `validateRange` call, with the same numbers, the scene gate makes on
 * the staged light. A film must not be able to state through time what
 * `commitScene` refuses outright.
 *
 * A `cubicspline` interleaves in-tangent, value, and out-tangent per keyframe.
 * Tangents are derivatives and remain unbounded; the key values and the curve
 * they produce do not. Its interior extrema are the roots of the Hermite
 * polynomial's derivative, evaluated through the SAME {@link cubicHermiteValue}
 * playback uses (#1371).
 */
const appendLightValueBounds: (
  track: IAutoMovieTrack,
  property: AutoMovieLightProperty,
  path: string,
  violations: IAutoMovieConstraintViolation[],
) => void = (
  track: IAutoMovieTrack,
  property: AutoMovieLightProperty,
  path: string,
  violations: IAutoMovieConstraintViolation[],
): void => {
  const { bounds }: IAutoMovieLightChannelProperty =
    LIGHT_CHANNEL_PROPERTIES[property];
  if (track.interpolation === "cubicspline") {
    appendCubicLightValueBounds(track, property, path, violations);
    return;
  }
  track.values.forEach((value: number, k: number): void => {
    // Finiteness belongs to the shared track-shape contract
    // (`clipTrackShapeFaults`), which reports it at this very path. Adding a
    // range verdict on top would read as two separate faults for one mistake.
    validateRange(
      value,
      `${path}.values[${k}]`,
      bounds.min,
      bounds.max,
      `light ${property}`,
      violations,
      bounds.inclusiveMin,
    );
  });
  appendLightKeyValueFaults(track, property, path, false, violations);
};

/**
 * The whole-value rule of one light property
 * ({@link IAutoMovieLightChannelProperty.valueFault}), applied to every keyframe
 * of one track.
 *
 * Separate from the per-component pass because it reads a keyframe as a unit: a
 * light `rotation` is unit-length or it is not, and that question cannot be
 * asked one component at a time. `cubic` says where the value sits inside a
 * stored keyframe, which is the whole difference between the two payload
 * layouts — a `cubicspline` keyframe is in-tangent / value / out-tangent, so
 * the value starts one width in. Tangents are derivatives and carry no such
 * rule.
 *
 * A payload whose length is not a whole number of keyframes states no keyframe
 * to judge; the shared shape gate has already refused it, and slicing one out
 * of it anyway would report a fault about a value the author never wrote.
 */
const appendLightKeyValueFaults: (
  track: IAutoMovieTrack,
  property: AutoMovieLightProperty,
  path: string,
  cubic: boolean,
  violations: IAutoMovieConstraintViolation[],
) => void = (
  track: IAutoMovieTrack,
  property: AutoMovieLightProperty,
  path: string,
  cubic: boolean,
  violations: IAutoMovieConstraintViolation[],
): void => {
  const { valueFault }: IAutoMovieLightChannelProperty =
    LIGHT_CHANNEL_PROPERTIES[property];
  if (valueFault === undefined) return;
  // The width the shared track-shape contract measures this channel by.
  const width: number = channelValueWidth(track.channel)!;
  const stride: number = cubic ? width * 3 : width;
  const values: number[] = track.values;
  if (values.length === 0 || values.length % stride !== 0) return;
  for (let key: number = 0; key * stride < values.length; ++key) {
    const base: number = key * stride + (cubic ? width : 0);
    const value: number[] = values.slice(base, base + width);
    const fault: string | null = valueFault(value);
    if (fault !== null)
      pushViolation(
        violations,
        "range",
        `${path}.values`,
        `light ${property} keyframe ${key} ${fault}`,
        value,
      );
  }
};

/** A finite scalar lies inside one light property's documented range. */
function lightValueInBounds(
  value: number,
  property: AutoMovieLightProperty,
): boolean {
  const {
    min,
    max,
    inclusiveMin,
  }: { min: number; max: number; inclusiveMin: boolean } =
    LIGHT_CHANNEL_PROPERTIES[property].bounds;
  return (inclusiveMin ? value >= min : value > min) && value <= max;
}

/**
 * Normalize finite derivative coefficients before solving, retaining tiny
 * nonzero curves; select roots strictly inside (0,1), with stable paired roots
 * avoiding subtraction cancellation.
 */
function interiorQuadraticRoots(a: number, b: number, c: number): number[] {
  const scale: number = Math.max(Math.abs(a), Math.abs(b), Math.abs(c));
  if (scale === 0) return [];
  const qa: number = a / scale;
  const qb: number = b / scale;
  const qc: number = c / scale;
  const roots: number[] =
    qa === 0
      ? qb === 0
        ? []
        : [-qc / qb]
      : ((): number[] => {
          const discriminant: number = qb * qb - 4 * qa * qc;
          if (discriminant < 0) return [];
          const root: number = Math.sqrt(discriminant);
          if (root === 0) return [-qb / (2 * qa)];
          const paired: number = -0.5 * (qb + (qb >= 0 ? root : -root));
          return [paired / qa, qc / paired];
        })();
  return roots.filter((root: number): boolean => root > 0 && root < 1);
}

/** Validate cubic key values and every interior Hermite extremum. */
const appendCubicLightValueBounds: (
  track: IAutoMovieTrack,
  property: AutoMovieLightProperty,
  path: string,
  violations: IAutoMovieConstraintViolation[],
) => void = (
  track: IAutoMovieTrack,
  property: AutoMovieLightProperty,
  path: string,
  violations: IAutoMovieConstraintViolation[],
): void => {
  const times: number[] = track.times;
  const values: number[] = track.values;
  // The width the shared track-shape contract measures this channel by.
  const width: number = channelValueWidth(track.channel)!;
  const stride: number = width * 3;
  // The shared clip-shape gate owns every malformed case. Stop here rather
  // than deriving ranges from a stride or clock it has already refused.
  if (
    times.length === 0 ||
    values.length !== times.length * stride ||
    times.some(
      (time: number, index: number): boolean =>
        index > 0 && !(time > times[index - 1]!),
    )
  )
    return;

  let keysInBounds: boolean = true;
  for (let key: number = 0; key < times.length; ++key)
    for (let component: number = 0; component < width; ++component) {
      const index: number = key * stride + width + component;
      const value: number = values[index]!;
      if (!lightValueInBounds(value, property)) keysInBounds = false;
      validateRange(
        value,
        `${path}.values[${index}]`,
        LIGHT_CHANNEL_PROPERTIES[property].bounds.min,
        LIGHT_CHANNEL_PROPERTIES[property].bounds.max,
        `light ${property}`,
        violations,
        LIGHT_CHANNEL_PROPERTIES[property].bounds.inclusiveMin,
      );
    }
  appendLightKeyValueFaults(track, property, path, true, violations);
  if (!keysInBounds) return;
  // A rotation is renormalized AT PLAYBACK: `sampleClip`'s `cubicHermite` puts
  // an interpolated quaternion back on the unit sphere before anything reads
  // it, so the value the film actually plays is unit at every interior instant
  // and every component of it is inside `[-1, 1]` by construction. The Hermite
  // overshoot this analysis hunts for therefore cannot reach the light, and
  // reporting it would refuse a declaration that renders correctly. The keys
  // themselves are still judged above, because the sampler returns a boundary
  // key VERBATIM, without that renormalization.
  if (LIGHT_CHANNEL_PROPERTIES[property].valueType === "quaternion") return;

  for (let segment: number = 0; segment + 1 < times.length; ++segment) {
    const span: number = times[segment + 1]! - times[segment]!;
    for (let component: number = 0; component < width; ++component) {
      const leftBase: number = segment * stride;
      const rightBase: number = (segment + 1) * stride;
      const left: number = values[leftBase + width + component]!;
      const outTangent: number = values[leftBase + 2 * width + component]!;
      const right: number = values[rightBase + width + component]!;
      const inTangent: number = values[rightBase + component]!;
      // Derivative of the shared Hermite cubic in normalized segment time.
      const a: number =
        6 * left + 3 * span * outTangent - 6 * right + 3 * span * inTangent;
      const b: number =
        -6 * left - 4 * span * outTangent + 6 * right - 2 * span * inTangent;
      const c: number = span * outTangent;
      for (const t of interiorQuadraticRoots(a, b, c)) {
        const value: number = cubicHermiteValue(
          left,
          outTangent,
          right,
          inTangent,
          span,
          t,
        );
        if (lightValueInBounds(value, property)) continue;
        pushViolation(
          violations,
          "range",
          `${path}.values`,
          `light ${property} cubicspline segment ${segment} component ${component} leaves its documented range at t=${t} (value ${value})`,
          value,
        );
      }
    }
  }
};
