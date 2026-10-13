import { AutoMovieChannelValueType } from "@automovie/interface";

import { IAutoMovieLightOverride } from "./IAutoMovieLightOverride";

/**
 * One animatable light property: how it is addressed, and how it is applied.
 *
 * @author Samchon
 */
export interface IAutoMovieLightChannelProperty {
  /**
   * The value type the addressing pointer channel must declare, which is also
   * the only place this axis states a value's WIDTH. `sampleClip` already owns
   * the value-type → width mapping and refuses a track that disagrees with it,
   * so restating "vec3 is three numbers" here would be a second copy of a rule
   * that already has an owner, and the two could drift.
   */
  valueType: AutoMovieChannelValueType;

  /**
   * The bounds every component of a keyframe value must satisfy: the SAME ones
   * the staged light is held to by the scene gate. Without them a track could
   * state through time what `commitScene` refuses outright (a negative
   * intensity, a 200-degree cone), and the axis would be the one place in the
   * artifact where a documented range is not enforced.
   */
  bounds: {
    /** Lower bound. */
    min: number;
    /** Upper bound, `Infinity` for none. */
    max: number;
    /** Whether {@link min} itself is allowed (`false` for the spot cone). */
    inclusiveMin: boolean;
  };

  /**
   * Whether a light of this kind (`IAutoMovieLight["type"]`) carries the
   * property at all: `range` is meaningless on a directional (infinitely
   * distant) light and `coneAngle` exists only on a spot. The gate asks this
   * before admitting a track, so a track the applier could not honor is refused
   * at commit rather than dropped at playback.
   *
   * Placement splits the same way, and along the other axis. A directional
   * light is infinitely distant, so `IAutoMovieLight.transform` documents that
   * "only the orientation matters" and it carries no `position`; a point light
   * radiates equally in every direction, so it carries no `rotation`. A spot
   * carries both, being the one kind that has somewhere to stand AND somewhere
   * to look.
   *
   * The parameter is `unknown` so the gate can ask it of a staged light's raw
   * `type` without first asserting the union it is reading — asserting the
   * value a check is about to doubt is how a validator stops validating. A kind
   * outside the union is a broken scene the scene gate owns, not something this
   * predicate is deciding.
   */
  carries: (kind: unknown) => boolean;

  /**
   * A rule the whole keyframe VALUE must satisfy, beyond the per-component
   * {@link bounds}, as a sentence with no subject, or `null` when the value is
   * sound. Absent when the components are the whole rule, which is every scalar
   * and colour axis.
   *
   * It exists because {@link bounds} is a per-component range and some
   * constraints are not: a rotation's four components are jointly constrained
   * to unit length, and no range over one component can say so. The gate reads
   * it off this table for the same reason it reads everything else here — a
   * rule stated beside the applier cannot drift from what the applier writes.
   */
  valueFault?: (value: readonly unknown[]) => string | null;

  /**
   * Record the sampled value. Precondition: {@link carries} accepted the light,
   * and `value` is as wide as {@link valueType} resolves to — the gate
   * establishes the first, `sampleClip`'s width check the second, before a
   * value ever reaches here.
   */
  write: (override: IAutoMovieLightOverride, value: readonly number[]) => void;
}
