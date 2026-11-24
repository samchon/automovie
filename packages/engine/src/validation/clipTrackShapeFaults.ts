import type {
  IAutoMovieClipShapeFault,
  IAutoMovieClipTrackShapeFaults,
} from "@automovie/interface";

import { channelValueWidth } from "./channelValueWidth";

/** Accumulate ordered keyframe-clock, finite-value and stride faults. */
export const clipTrackShapeFaults: (
  track: IAutoMovieClipTrackShapeFaults.ITrack,
  duration: number,
) => IAutoMovieClipShapeFault[] = (
  track: IAutoMovieClipTrackShapeFaults.ITrack,
  duration: number,
): IAutoMovieClipShapeFault[] => {
  const faults: IAutoMovieClipShapeFault[] = [];
  const { times, values, interpolation, channel }: typeof track = track;

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
    const value: number = values[i]!;
    if (!Number.isFinite(value))
      faults.push({
        kind: "range",
        field: `values[${i}]`,
        message: `values[${i}] must be finite, but was ${value}`,
        value,
      });
  }

  // The clock, per keyframe. The sampler checks only the FIRST time's sign and
  // the LAST time against the duration, which is equivalent once the times are
  // strictly increasing; checking every entry says which one is wrong when they
  // are not, and refuses nothing an increasing list would have passed.
  const bounded: number | null =
    Number.isFinite(duration) && duration > 0 ? duration : null;
  const timeCount: number = times.length;
  for (let i: number = 0; i < timeCount; ++i) {
    const time: number = times[i]!;
    if (!Number.isFinite(time))
      faults.push({
        kind: "temporal",
        field: `times[${i}]`,
        message: `keyframe times must be finite, but times[${i}] was ${time}`,
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
    const time: number = times[i]!;
    if (!Number.isFinite(time)) continue;
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
  // Every number this fault judges rides the message (#1362): the width
  // belongs HERE rather than one check later, because the width arithmetic
  // below is meaningless on a fractional stride, so continuing would report a
  // computed width that is not a real one.
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
