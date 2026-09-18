import { IAutoMovieConstraintViolation } from "@automovie/interface";
import { cubicHermiteValue } from "../math/cubicHermiteValue";
import { AutoMovieLightProperty } from "../resolve/AutoMovieLightProperty";
import { LIGHT_CHANNEL_PROPERTIES } from "../resolve/LIGHT_CHANNEL_PROPERTIES";
import { parseLightPointer } from "../resolve/parseLightPointer";
import { asArray } from "./asArray";
import { isRecord } from "./isRecord";
import { pushViolation } from "./pushViolation";
import { validateArrayArtifact } from "./validateArrayArtifact";
import { validateRange } from "./validateRange";
import { validateUniqueBy } from "./validateUniqueBy";
import { validateUniqueIds } from "./validateUniqueIds";
import { channelValueWidth } from "./channelValueWidth";
import { lightClipChannelGate } from "./lightClipChannelGate";
import { validateClipArtifact } from "./validateClipArtifact";

/**
 * The shot's `lightMotions`, gated the way every other optional shot field is:
 * absent stays valid ("absent means legacy"), a present value is inspected in
 * full.
 *
 * Each clip goes through {@link validateClipArtifact} unchanged, so a light clip
 * is held to the SAME track-shape contract `sampleClip` reads (#1353): strictly
 * increasing times inside the duration, a whole-number stride, the width the
 * channel's `valueType` fixes, a supported interpolation, a boolean `loop`.
 * Those rules are about a track, not about a node, and re-deciding them here
 * would re-split the contract that issue just made single.
 *
 * Beyond that shape, three rules are this field's alone: which channel a track
 * may address, which light kinds carry the property, and the value's own
 * range.
 *
 * Two of them are worth stating.
 *
 * No two tracks in the whole field may address the same light property. Within
 * one clip `validateClipArtifact` already refuses a duplicate channel, but two
 * CLIPS both dimming the same candle would resolve last-writer-wins, which is a
 * deterministic answer to a question the artifact never meant to ask. Refusing
 * it keeps the committed film's lighting single-valued at every instant.
 *
 * And every keyframe value is held to the property's own bounds
 * ({@link appendLightValueBounds}), because the light a track drives has a
 * documented range that the scene gate already enforces on the staged value.
 *
 * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-path-and-scope `appendLightMotionsArtifact` reports duplicate light-clip ids, duplicate target properties, malformed tracks, and invalid key values at their lightMotions paths.
 * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-path-scope `appendLightMotionsArtifact` preserves clip index, track index, staged-light identity, property address, and observed key value for each optional-field finding.
 */
export const appendLightMotionsArtifact = (
  lightMotions: unknown,
  path: string,
  /**
   * The scene's light id → kind index, or `null` with no scene to check
   * against.
   */
  stagedLights: ReadonlyMap<string, unknown> | null,
  violations: IAutoMovieConstraintViolation[],
): void => {
  if (lightMotions === undefined) return;
  if (
    !validateArrayArtifact(lightMotions, path, "shot lightMotions", violations)
  )
    return;
  validateUniqueIds(lightMotions, path, "light motion clip id", violations);
  const gate = lightClipChannelGate(stagedLights);
  const addressed: { id: unknown; path: string }[] = [];
  lightMotions.forEach((clip, i) => {
    const clipPath = `${path}[${i}]`;
    validateClipArtifact(clip, clipPath, violations, gate);
    asArray(isRecord(clip) ? clip.tracks : undefined).forEach((track, j) => {
      const trackPath = `${clipPath}.tracks[${j}]`;
      // A track that is not an object addresses nothing; `validateClipArtifact`
      // has already refused it at its own index. Narrowing here rather than
      // re-asking further down keeps the bounds pass free of a guard its caller
      // has already decided, which no input could ever reach.
      if (!isRecord(track)) {
        addressed.push({ id: undefined, path: `${trackPath}.channel` });
        return;
      }
      const channel: unknown = track.channel;
      const target = isRecord(channel)
        ? parseLightPointer(channel.pointer)
        : null;
      addressed.push({
        id: target === null ? undefined : `${target.light}/${target.property}`,
        path: `${trackPath}.channel`,
      });
      if (target !== null)
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
const appendLightValueBounds = (
  track: Record<string, unknown>,
  property: AutoMovieLightProperty,
  path: string,
  violations: IAutoMovieConstraintViolation[],
): void => {
  const { bounds } = LIGHT_CHANNEL_PROPERTIES[property];
  if (track.interpolation === "cubicspline") {
    appendCubicLightValueBounds(track, property, path, violations);
    return;
  }
  asArray(track.values).forEach((value, k) => {
    // Finiteness belongs to the shared track-shape contract
    // (`clipTrackShapeFaults`), which reports it at this very path. Adding a
    // range verdict on top would read as two separate faults for one mistake.
    if (!Number.isFinite(value)) return;
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
 * The per-keyframe value width of one light property, read from the SAME table
 * `clipTrackShapeFaults` measures a track against.
 *
 * Never `undefined` here: that answer is reserved for a `weights` channel,
 * whose width is the model's morph-target count, and no light property declares
 * one. Deriving the width locally is what let this file's cubic pass carry
 * `scalar ? 1 : 3`, a rule that was right only while every non-scalar axis
 * happened to be a `vec3`.
 */
const lightValueWidth = (property: AutoMovieLightProperty): number =>
  channelValueWidth({
    kind: "pointer",
    valueType: LIGHT_CHANNEL_PROPERTIES[property].valueType,
  })!;

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
const appendLightKeyValueFaults = (
  track: Record<string, unknown>,
  property: AutoMovieLightProperty,
  path: string,
  cubic: boolean,
  violations: IAutoMovieConstraintViolation[],
): void => {
  const { valueFault } = LIGHT_CHANNEL_PROPERTIES[property];
  if (valueFault === undefined) return;
  const width = lightValueWidth(property);
  const stride = cubic ? width * 3 : width;
  const values = asArray(track.values);
  if (values.length === 0 || values.length % stride !== 0) return;
  for (let key = 0; key * stride < values.length; ++key) {
    const base = key * stride + (cubic ? width : 0);
    const value = values.slice(base, base + width);
    const fault = valueFault(value);
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
const lightValueInBounds = (
  value: number,
  property: AutoMovieLightProperty,
): boolean => {
  const { min, max, inclusiveMin } = LIGHT_CHANNEL_PROPERTIES[property].bounds;
  return (inclusiveMin ? value >= min : value > min) && value <= max;
};

/** Roots of `a*t² + b*t + c` strictly inside the normalized segment `(0, 1)`. */
const interiorQuadraticRoots = (a: number, b: number, c: number): number[] => {
  const epsilon = 1e-12;
  const roots =
    Math.abs(a) < epsilon
      ? Math.abs(b) < epsilon
        ? []
        : [-c / b]
      : (() => {
          const discriminant = b * b - 4 * a * c;
          if (discriminant < 0) return [];
          const root = Math.sqrt(discriminant);
          return root < epsilon
            ? [-b / (2 * a)]
            : [(-b - root) / (2 * a), (-b + root) / (2 * a)];
        })();
  return roots.filter((root) => root > 0 && root < 1);
};

/** Validate cubic key values and every interior Hermite extremum. */
const appendCubicLightValueBounds = (
  track: Record<string, unknown>,
  property: AutoMovieLightProperty,
  path: string,
  violations: IAutoMovieConstraintViolation[],
): void => {
  const times = asArray(track.times);
  const values = asArray(track.values);
  const width = lightValueWidth(property);
  const stride = width * 3;
  // The shared clip-shape gate owns every malformed case. Stop here rather
  // than deriving ranges from a stride or clock it has already refused.
  if (
    times.length === 0 ||
    values.length !== times.length * stride ||
    !times.every((time) => Number.isFinite(time)) ||
    !values.every((value) => Number.isFinite(value)) ||
    times.some(
      (time, index) =>
        index > 0 && !((time as number) > (times[index - 1] as number)),
    )
  )
    return;

  let keysInBounds = true;
  for (let key = 0; key < times.length; ++key)
    for (let component = 0; component < width; ++component) {
      const index = key * stride + width + component;
      const value = values[index] as number;
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

  for (let segment = 0; segment + 1 < times.length; ++segment) {
    const span = (times[segment + 1] as number) - (times[segment] as number);
    for (let component = 0; component < width; ++component) {
      const leftBase = segment * stride;
      const rightBase = (segment + 1) * stride;
      const left = values[leftBase + width + component] as number;
      const outTangent = values[leftBase + 2 * width + component] as number;
      const right = values[rightBase + width + component] as number;
      const inTangent = values[rightBase + component] as number;
      // Derivative of the shared Hermite cubic in normalized segment time.
      const a =
        6 * left + 3 * span * outTangent - 6 * right + 3 * span * inTangent;
      const b =
        -6 * left - 4 * span * outTangent + 6 * right - 2 * span * inTangent;
      const c = span * outTangent;
      for (const t of interiorQuadraticRoots(a, b, c)) {
        const value = cubicHermiteValue(
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
