import { AutoMovieInterpolation } from "@automovie/interface";
import { IAutoMovieClipShapeFault } from "./IAutoMovieClipShapeFault";
import { TRACK_INTERPOLATIONS } from "./TRACK_INTERPOLATIONS";
import { channelValueWidth } from "./channelValueWidth";

/**
 * Every way one track's keyframe payload can be unreadable, in the order
 * {@link sampleClip} discovers them (its first throw is this list's first
 * entry).
 *
 * Every field is read as `unknown`, because a stored track carries whatever
 * JSON it carries. A field of the wrong TYPE yields no fault here, because the
 * caller reading that JSON reports it separately and one mistake earns one
 * violation.
 *
 * @evidence requirements/motion/clips-keyframes-and-interpolation.md#motion-clip-refusal `clipTrackShapeFaults` enumerates every malformed track condition that must prevent clip playback.
 * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation `clipTrackShapeFaults` preserves sampler discovery order so the artifact gate refuses the same unreadable keyframe state.
 */
export const clipTrackShapeFaults = (
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
  const { times, values, interpolation, channel } = track;

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

  values.forEach((value, i) => {
    if (!Number.isFinite(value))
      faults.push({
        kind: "range",
        field: `values[${i}]`,
        message: `values[${i}] must be finite, but was ${String(value)}`,
        value,
      });
  });

  // The clock, per keyframe. The sampler checks only the FIRST time's sign and
  // the LAST time against the duration, which is equivalent once the times are
  // strictly increasing; checking every entry says which one is wrong when they
  // are not, and refuses nothing an increasing list would have passed.
  const bounded =
    typeof duration === "number" && Number.isFinite(duration) && duration > 0
      ? duration
      : null;
  times.forEach((time, i) => {
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
  });

  let previous: number | null = null;
  times.forEach((time, i) => {
    if (typeof time !== "number" || !Number.isFinite(time)) return;
    if (previous !== null && time <= previous)
      faults.push({
        kind: "temporal",
        field: `times[${i}]`,
        message: `keyframe times must be strictly increasing; ${time} is not greater than ${previous}`,
        value: time,
      });
    previous = time;
  });

  // The stride the sampler slices each keyframe's value by. Everything below it
  // is arithmetic on that stride, so a stride that is not a whole number ends
  // the analysis: the widths it would imply are meaningless.
  if (times.length === 0 || values.length === 0) return faults;
  const cubic = interpolation === "cubicspline";
  const expected = channelValueWidth(channel);
  // What ONE keyframe occupies on this channel: its width, tripled for
  // `cubicspline`, which stores in-tangent / value / out-tangent per keyframe.
  // `undefined` for a `weights` channel, whose width is the model's morph
  // target count and therefore not the track's to state.
  const perKeyframe = (channelWidth: number): number =>
    cubic ? channelWidth * 3 : channelWidth;
  // Every number this fault judges rides the message (#1362). It used to say
  // only the rule ("divide evenly"), and the sibling check that names the width
  // sits below the `return` this fault takes, so the author most lost was the
  // one told least: four consecutive commits failed to converge on a 67-frame
  // trajectory because nothing stated 67, 195, or the 201 that would satisfy
  // it. The width belongs HERE rather than one check later, because the width
  // arithmetic below is meaningless on a fractional stride, so continuing would
  // report a computed width that is not a real one.
  const stride = values.length / times.length;
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
  const width = cubic ? stride / 3 : stride;
  if (expected !== undefined && width !== expected)
    faults.push({
      kind: "type",
      field: "values",
      message: `value width must be ${expected}, but was ${width}; ${values.length} values / ${times.length} times must be ${perKeyframe(expected) * times.length}`,
      value: values.length,
    });
  return faults;
};
