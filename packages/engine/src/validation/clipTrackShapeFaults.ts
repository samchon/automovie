import { AutoMovieInterpolation } from "@automovie/interface";

import { IAutoMovieClipShapeFault } from "./IAutoMovieClipShapeFault";
import { channelValueWidth } from "./channelValueWidth";
import { TRACK_INTERPOLATIONS } from "./constants/TRACK_INTERPOLATIONS";

/**
 * Accumulate ordered interpolation, keyframe-clock, finite-value and stride faults.
 *
 * @evidence contracts/common.md#principled-implementation Supported interpolation is checked before array traversal; finite value/time and monotone-clock findings precede whole-number stride, cubic triplet and canonical fixed-width checks. Positive finite duration bounds key times, while zero-duration sampler semantics stay separate.
 * @evidence contracts/common.md#clear-and-simple-design The artifact gate reports this ordered fault list and sampleClip throws its first item, sharing payload arithmetic rather than duplicated shape rules.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing arrays stop population checks after interpolation admission; indexed walks inspect every declared slot, so resident holes produce located nonfinite findings. No padded keyframe, rounded stride or guessed weights width repairs malformed input.
 * @evidence contracts/common.md#meaningful-documentation Documents ordered findings, structural fields, interpolation and scalar-count diagnostics; missing numeric slots are refused by both gate and sampler rather than being skipped by array iteration.
 * @evidence contracts/performance.md#efficient-algorithms K times and V values require O(K+V) passes and O(F) findings, with constant stride arithmetic and output message work; no repeated scan per sampled key occurs within this call.
 * @evidence contracts/performance.md#reuse-equivalent-work Canonical interpolation and width owners serve both gate and sampler; the same borrowed arrays drive all shape decisions without a retained admission cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Most faults retain scalar values/counts, while empty-array faults retain their original array; no clip cursor, sampled frames or host task survives through the helper.
 * @author Samchon
 */
export const clipTrackShapeFaults: (
  track: {
    times?: unknown;
    values?: unknown;
    interpolation?: unknown;
    channel?: unknown;
  },
  duration: unknown,
) => IAutoMovieClipShapeFault[] = (
  /**
   * Structural rather than {@link IAutoMovieTrack}, so both callers pass their
   * own value without a cast and without a re-check: the gate has already
   * narrowed a stored track to a record, the sampler holds the typed one.
   */
  track: {
    times?: unknown;
    values?: unknown;
    interpolation?: unknown;
    channel?: unknown;
  },
  duration: unknown,
): IAutoMovieClipShapeFault[] => {
  const faults: IAutoMovieClipShapeFault[] = [];
  const { times, values, interpolation, channel }: typeof track = track;

  if (!TRACK_INTERPOLATIONS.has(interpolation as AutoMovieInterpolation))
    faults.push({
      kind: "type",
      field: "interpolation",
      message: `interpolation "${String(interpolation)}" is not supported`,
      value: interpolation,
    });
  if (!Array.isArray(times) || !Array.isArray(values)) return faults;

  if (times.length === 0)
    faults.push({
      kind: "type",
      field: "times",
      message: "must have keyframes to sample",
      value: times,
    });
  if (values.length === 0)
    faults.push({
      kind: "type",
      field: "values",
      message: "values must not be empty",
      value: values,
    });

  const valueCount: number = values.length;
  for (let i: number = 0; i < valueCount; ++i) {
    const value: unknown = values[i];
    if (!Number.isFinite(value))
      faults.push({
        kind: "range",
        field: `values[${i}]`,
        message: `values[${i}] must be finite, but was ${String(value)}`,
        value,
      });
  }

  // The clock, per keyframe. The sampler checks only the FIRST time's sign and
  // the LAST time against the duration, which is equivalent once the times are
  // strictly increasing; checking every entry says which one is wrong when they
  // are not, and refuses nothing an increasing list would have passed.
  const bounded: number | null =
    typeof duration === "number" && Number.isFinite(duration) && duration > 0
      ? duration
      : null;
  const timeCount: number = times.length;
  for (let i: number = 0; i < timeCount; ++i) {
    const time: unknown = times[i];
    if (typeof time !== "number" || !Number.isFinite(time))
      faults.push({
        kind: "temporal",
        field: `times[${i}]`,
        message: `keyframe times must be finite, but times[${i}] was ${String(time)}`,
        value: time,
      });
    else if (time < 0)
      faults.push({
        kind: "temporal",
        field: `times[${i}]`,
        message: `keyframe times must be non-negative, but times[${i}] was ${time}`,
        value: time,
      });
    else if (bounded !== null && time > bounded)
      faults.push({
        kind: "temporal",
        field: `times[${i}]`,
        message: `keyframe times must be within clip duration ${bounded}, but times[${i}] was ${time}`,
        value: time,
      });
  }

  let previous: number | null = null;
  for (let i: number = 0; i < timeCount; ++i) {
    const time: unknown = times[i];
    if (typeof time !== "number" || !Number.isFinite(time)) continue;
    if (previous !== null && time <= previous)
      faults.push({
        kind: "temporal",
        field: `times[${i}]`,
        message: `keyframe times must be strictly increasing; ${time} is not greater than ${previous}`,
        value: time,
      });
    previous = time;
  }

  // The stride the sampler slices each keyframe's value by. Everything below it
  // is arithmetic on that stride, so a stride that is not a whole number ends
  // the analysis: the widths it would imply are meaningless.
  if (times.length === 0 || values.length === 0) return faults;
  const cubic: boolean = interpolation === "cubicspline";
  const expected: number | undefined = channelValueWidth(channel);
  // What ONE keyframe occupies on this channel: its width, tripled for
  // `cubicspline`, which stores in-tangent / value / out-tangent per keyframe.
  // `undefined` for a `weights` channel, whose width is the model's morph
  // target count and therefore not the track's to state.
  const perKeyframe: (channelWidth: number) => number = (
    channelWidth: number,
  ): number => (cubic ? channelWidth * 3 : channelWidth);
  // Every number this fault judges rides the message (#1362). It used to say
  // only the rule ("divide evenly"), and the sibling check that names the width
  // sits below the `return` this fault takes, so the author most lost was the
  // one told least: four consecutive commits failed to converge on a 67-frame
  // trajectory because nothing stated 67, 195, or the 201 that would satisfy
  // it. The width belongs HERE rather than one check later, because the width
  // arithmetic below is meaningless on a fractional stride, so continuing would
  // report a computed width that is not a real one.
  const stride: number = values.length / times.length;
  if (!Number.isInteger(stride)) {
    faults.push({
      kind: "type",
      field: "values",
      message:
        `values length must divide evenly by keyframe count ${times.length}, but ${values.length} does not` +
        (expected === undefined
          ? ""
          : `; this channel carries ${perKeyframe(expected)} per keyframe, so values must hold ${perKeyframe(expected) * times.length}`),
      // The LENGTH, not the array: a dense track echoed hundreds of floats back
      // into the client's context to say nothing the message did not.
      value: values.length,
    });
    return faults;
  }
  if (cubic && stride % 3 !== 0) {
    faults.push({
      kind: "type",
      field: "values",
      message: `cubicspline stride must be divisible by 3, but ${values.length} values / ${times.length} times gives ${stride}`,
      value: values.length,
    });
    return faults;
  }
  const width: number = cubic ? stride / 3 : stride;
  if (expected !== undefined && width !== expected)
    faults.push({
      kind: "type",
      field: "values",
      message: `value width must be ${expected}, but was ${width}; ${values.length} values / ${times.length} times must be ${perKeyframe(expected) * times.length}`,
      value: values.length,
    });
  return faults;
};
