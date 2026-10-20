import { IAutoMovieConstraintViolation } from "@automovie/interface";

import { cubicHermiteValue } from "../math/cubicHermiteValue";
import { AutoMovieLightProperty } from "../resolve/AutoMovieLightProperty";
import { IAutoMovieLightChannelProperty } from "../resolve/IAutoMovieLightChannelProperty";
import { IAutoMovieLightPointer } from "../resolve/IAutoMovieLightPointer";
import { LIGHT_CHANNEL_PROPERTIES } from "../resolve/constants/LIGHT_CHANNEL_PROPERTIES";
import { parseLightPointer } from "../resolve/parseLightPointer";
import { IAutoMovieClipChannelGate } from "./IAutoMovieClipChannelGate";
import { asArray } from "./asArray";
import { channelValueWidth } from "./channelValueWidth";
import { isRecord } from "./isRecord";
import { lightClipChannelGate } from "./lightClipChannelGate";
import { pushViolation } from "./pushViolation";
import { validateArrayArtifact } from "./validateArrayArtifact";
import { validateClipArtifact } from "./validateClipArtifact";
import { validateRange } from "./validateRange";
import { validateUniqueBy } from "./validateUniqueBy";
import { validateUniqueIds } from "./validateUniqueIds";

/**
 * Append light-clip shape, target, uniqueness and range findings for a shot.
 *
 * @evidence contracts/common.md#principled-implementation Canonical clip admission and light-pointer/property owners precede per-key bounds and scale-normalized Hermite derivative roots evaluated through the playback scalar owner. Finite quaternion interior is exempt because playback normalizes it; keyed rotations still require unit norm.
 * @evidence contracts/common.md#clear-and-simple-design One light pass joins shared channel/track shape with light-kind/property policy and field-wide channel uniqueness, keeping interpolation arithmetic shared with playback.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Absent lightMotions is legacy-valid and malformed tracks retain located findings without fabricated clips. Nonzero derivative coefficients are not discarded by an absolute floor; overflow before coefficient normalization or in playback evaluation remains a numeric limitation rather than a universal range proof.
 * @evidence contracts/common.md#meaningful-documentation States optional-field meaning, staged-light index, duplicate target scope, key/tangent distinction, quaternion exemption and unresolved extrema precision limits.
 * @evidence contracts/performance.md#efficient-algorithms For C clips, T tracks and K stored scalars/times, shared admission plus key/extrema traversal is linear in those populations and message sizes; address rows and findings require O(T+F) storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Shared property bounds and channel width feed both key and cubic checks, and each Hermite extremum uses the canonical evaluator; mutable clip records have no retained verdict cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only appended findings and their offending values persist in the caller array; temporary target rows, slices and roots are local and no lighting/GPU host is acquired.
 */
export const appendLightMotionsArtifact: (
  lightMotions: unknown,
  path: string,
  stagedLights: ReadonlyMap<string, unknown> | null,
  violations: IAutoMovieConstraintViolation[],
) => void = (
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
  const gate: IAutoMovieClipChannelGate = lightClipChannelGate(stagedLights);
  const addressed: { id: unknown; path: string }[] = [];
  lightMotions.forEach((clip: unknown, i: number): void => {
    const clipPath: string = `${path}[${i}]`;
    validateClipArtifact(clip, clipPath, violations, gate);
    asArray(isRecord(clip) ? clip.tracks : undefined).forEach(
      (track: unknown, j: number): void => {
        const trackPath: string = `${clipPath}.tracks[${j}]`;
        // A track that is not an object addresses nothing; `validateClipArtifact`
        // has already refused it at its own index. Narrowing here rather than
        // re-asking further down keeps the bounds pass free of a guard its caller
        // has already decided, which no input could ever reach.
        if (!isRecord(track)) {
          addressed.push({ id: undefined, path: `${trackPath}.channel` });
          return;
        }
        const channel: unknown = track.channel;
        const target: IAutoMovieLightPointer | null = isRecord(channel)
          ? parseLightPointer(channel.pointer)
          : null;
        addressed.push({
          id:
            target === null ? undefined : `${target.light}/${target.property}`,
          path: `${trackPath}.channel`,
        });
        if (target !== null)
          appendLightValueBounds(track, target.property, trackPath, violations);
      },
    );
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
  track: Record<string, unknown>,
  property: AutoMovieLightProperty,
  path: string,
  violations: IAutoMovieConstraintViolation[],
) => void = (
  track: Record<string, unknown>,
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
  asArray(track.values).forEach((value: unknown, k: number): void => {
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
const lightValueWidth: (property: AutoMovieLightProperty) => number = (
  property: AutoMovieLightProperty,
): number =>
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
const appendLightKeyValueFaults: (
  track: Record<string, unknown>,
  property: AutoMovieLightProperty,
  path: string,
  cubic: boolean,
  violations: IAutoMovieConstraintViolation[],
) => void = (
  track: Record<string, unknown>,
  property: AutoMovieLightProperty,
  path: string,
  cubic: boolean,
  violations: IAutoMovieConstraintViolation[],
): void => {
  const { valueFault }: IAutoMovieLightChannelProperty =
    LIGHT_CHANNEL_PROPERTIES[property];
  if (valueFault === undefined) return;
  const width: number = lightValueWidth(property);
  const stride: number = cubic ? width * 3 : width;
  const values: unknown[] = asArray(track.values);
  if (values.length === 0 || values.length % stride !== 0) return;
  for (let key: number = 0; key * stride < values.length; ++key) {
    const base: number = key * stride + (cubic ? width : 0);
    const value: unknown[] = values.slice(base, base + width);
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
const lightValueInBounds: (
  value: number,
  property: AutoMovieLightProperty,
) => boolean = (value: number, property: AutoMovieLightProperty): boolean => {
  const {
    min,
    max,
    inclusiveMin,
  }: { min: number; max: number; inclusiveMin: boolean } =
    LIGHT_CHANNEL_PROPERTIES[property].bounds;
  return (inclusiveMin ? value >= min : value > min) && value <= max;
};

/** Normalize finite derivative coefficients before solving, retaining tiny nonzero curves; select roots strictly inside (0,1), with stable paired roots avoiding subtraction cancellation. */
const interiorQuadraticRoots: (a: number, b: number, c: number) => number[] = (
  a: number,
  b: number,
  c: number,
): number[] => {
  const scale: number = Math.max(Math.abs(a), Math.abs(b), Math.abs(c));
  if (scale === 0 || !Number.isFinite(scale)) return [];
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
};

/** Validate cubic key values and every interior Hermite extremum. */
const appendCubicLightValueBounds: (
  track: Record<string, unknown>,
  property: AutoMovieLightProperty,
  path: string,
  violations: IAutoMovieConstraintViolation[],
) => void = (
  track: Record<string, unknown>,
  property: AutoMovieLightProperty,
  path: string,
  violations: IAutoMovieConstraintViolation[],
): void => {
  const times: unknown[] = asArray(track.times);
  const values: unknown[] = asArray(track.values);
  const width: number = lightValueWidth(property);
  const stride: number = width * 3;
  // The shared clip-shape gate owns every malformed case. Stop here rather
  // than deriving ranges from a stride or clock it has already refused.
  if (
    times.length === 0 ||
    values.length !== times.length * stride ||
    !times.every((time: unknown): boolean => Number.isFinite(time)) ||
    !values.every((value: unknown): boolean => Number.isFinite(value)) ||
    times.some(
      (time: unknown, index: number): boolean =>
        index > 0 && !((time as number) > (times[index - 1] as number)),
    )
  )
    return;

  let keysInBounds: boolean = true;
  for (let key: number = 0; key < times.length; ++key)
    for (let component: number = 0; component < width; ++component) {
      const index: number = key * stride + width + component;
      const value: number = values[index] as number;
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
    const span: number =
      (times[segment + 1] as number) - (times[segment] as number);
    for (let component: number = 0; component < width; ++component) {
      const leftBase: number = segment * stride;
      const rightBase: number = (segment + 1) * stride;
      const left: number = values[leftBase + width + component] as number;
      const outTangent: number = values[
        leftBase + 2 * width + component
      ] as number;
      const right: number = values[rightBase + width + component] as number;
      const inTangent: number = values[rightBase + component] as number;
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
