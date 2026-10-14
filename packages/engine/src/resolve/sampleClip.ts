import {
  IAutoMovieClip,
  IAutoMovieQuaternion,
  IAutoMovieTrack,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { cubicHermiteValue } from "../math/cubicHermiteValue";
import { segmentIndex } from "../math/segmentIndex";
import { clipDurationFault } from "../validation/clipDurationFault";
import { clipLoopFault } from "../validation/clipLoopFault";
import { clipTrackShapeFaults } from "../validation/clipTrackShapeFaults";
import type { IAutoMovieClipShapeFault } from "./../validation/IAutoMovieClipShapeFault";
import { IAutoMovieSampledChannel } from "./IAutoMovieSampledChannel";
import { channelIsRotation } from "./channelIsRotation";
import { channelKey } from "./channelKey";

/**
 * Sample every admitted track at finite clip-local seconds, clamped or duration-wrapped. STEP changes at exact keys, LINEAR uses quaternion slerp where declared, and cubic Hermite scales tangents by segment duration and normalizes interpolated rotations. Before/after-key endpoints copy authored values verbatim.
 *
 * @evidence contracts/common.md#principled-implementation Validate finite query time and canonical clip/track shape, normalize loop/clamp time, then evaluate STEP, linear quaternion/vector or glTF cubic Hermite tracks by channelKey.
 * @evidence contracts/common.md#clear-and-simple-design Shared faults own admission, segmentIndex owns binary search and quaternion/Hermite helpers own interpolation; this owner assembles samples.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Duplicates/malformed tracks throw and exact STEP keys use the new value; endpoints preserve authored payloads and unsupported extreme arithmetic can still overflow.
 * @evidence contracts/common.md#meaningful-documentation Docs state seconds, wrapping/clamping, tangent stride and quaternion interpolation/renormalization with endpoint ownership.
 * @evidence contracts/performance.md#efficient-algorithms Full key/value validation costs O(sum(K*W)) per sample; each track adds O(log K) search and O(W) returned vector storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Staging/playback share validators/interpolators; mutable clip contents are revalidated without an identity-only track cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns fresh vectors/map and borrows channels; temporary arrays release with the call and no animation host or task is held.
 */
export const sampleClip: (
  clip: IAutoMovieClip,
  seconds: number,
) => Map<string, IAutoMovieSampledChannel> = (
  clip: IAutoMovieClip,
  seconds: number,
): Map<string, IAutoMovieSampledChannel> => {
  validateSampleTime(seconds, clip.duration, clip.loop);
  const time: number = normalizeTime(seconds, clip.duration, clip.loop);
  const out: Map<string, IAutoMovieSampledChannel> = new Map<
    string,
    IAutoMovieSampledChannel
  >();
  for (const track of clip.tracks) {
    const key: string = channelKey(track.channel);
    if (out.has(key)) throw new Error(`duplicate track channel "${key}"`);
    out.set(key, {
      channel: track.channel,
      value: sampleTrack(track, time, clip.duration),
    });
  }
  return out;
};

/**
 * Sample one track at an already-normalized `time`. Splits on interpolation
 * mode: `step` holds the left key, `linear` lerps (slerp for rotations), and
 * `cubicspline` evaluates the glTF cubic Hermite spline from the keyframes'
 * tangents.
 */
const sampleTrack: (
  track: IAutoMovieTrack,
  time: number,
  duration: number,
) => number[] = (
  track: IAutoMovieTrack,
  time: number,
  duration: number,
): number[] => {
  const { times, values, interpolation, channel }: IAutoMovieTrack = track;
  const key: string = channelKey(channel);
  validateTrackShape(track, key, duration);

  const cubic: boolean = interpolation === "cubicspline";
  // Stored stride per keyframe; cubicspline stores in-tangent/value/out-tangent.
  const stride: number = values.length / times.length;
  const width: number = cubic ? stride / 3 : stride;

  // For cubicspline the value sits between the two tangents, offset by `width`.
  const valueAt: (i: number) => number[] = (i: number): number[] => {
    const base: number = i * stride + (cubic ? width : 0);
    return values.slice(base, base + width);
  };

  if (time <= times[0]!) return valueAt(0);
  const lastIdx: number = times.length - 1;
  if (time >= times[lastIdx]!) return valueAt(lastIdx);

  // Strictly increasing times (validateTrackShape) let the binary search land on
  // the straddling segment; its tie rule matches the old linear scan exactly.
  const lo: number = segmentIndex(
    times.length,
    (i: number): number => times[i]!,
    time,
  );
  const hi: number = lo + 1;
  const span: number = times[hi]! - times[lo]!;
  const localT: number = (time - times[lo]!) / span;

  // glTF STEP holds v_k for t_k <= t < t_{k+1}: an EXACT hit on the right key
  // (the bisect tie resolves it into the segment ENDING there, localT = 1)
  // belongs to the segment STARTING at that key (#1054). The fixed sampling
  // clock lands exactly on frame-aligned keys, so without this every step
  // change played one sample late, and asymmetrically to `ease("step", 1)`.
  if (interpolation === "step") return localT >= 1 ? valueAt(hi) : valueAt(lo);
  if (cubic) return cubicHermite(track, lo, hi, span, localT, width, stride);
  return channelIsRotation(channel)
    ? slerpArray(valueAt(lo), valueAt(hi), localT)
    : lerpArray(valueAt(lo), valueAt(hi), localT);
};

/**
 * GlTF cubic-spline (Hermite) evaluation between keyframes `lo` and `hi`. Each
 * keyframe stores `[inTangent, value, outTangent]`; the spline uses `lo`'s
 * out-tangent and `hi`'s in-tangent, scaled by the segment's `span`. Rotation
 * results are renormalized (interpolated quaternions drift off the unit
 * sphere).
 */
const cubicHermite: (
  track: IAutoMovieTrack,
  lo: number,
  hi: number,
  span: number,
  t: number,
  width: number,
  stride: number,
) => number[] = (
  track: IAutoMovieTrack,
  lo: number,
  hi: number,
  span: number,
  t: number,
  width: number,
  stride: number,
): number[] => {
  const { values, channel }: IAutoMovieTrack = track;
  const out: number[] = new Array<number>(width);
  for (let c: number = 0; c < width; ++c) {
    const vLo: number = values[lo * stride + width + c]!;
    const bLo: number = values[lo * stride + 2 * width + c]!;
    const vHi: number = values[hi * stride + width + c]!;
    const aHi: number = values[hi * stride + c]!;
    out[c] = cubicHermiteValue(vLo, bLo, vHi, aHi, span, t);
  }
  return channelIsRotation(channel) ? normalizeQuatArray(out) : out;
};

const lerpArray: (a: number[], b: number[], t: number) => number[] = (
  a: number[],
  b: number[],
  t: number,
): number[] => a.map((v: number, i: number): number => v + (b[i]! - v) * t);

const slerpArray: (a: number[], b: number[], t: number) => number[] = (
  a: number[],
  b: number[],
  t: number,
): number[] => {
  const q: IAutoMovieQuaternion = Quaternion.slerp(
    { x: a[0]!, y: a[1]!, z: a[2]!, w: a[3]! },
    { x: b[0]!, y: b[1]!, z: b[2]!, w: b[3]! },
    t,
  );
  return [q.x, q.y, q.z, q.w];
};

const normalizeQuatArray: (q: number[]) => number[] = (
  q: number[],
): number[] => {
  const n: IAutoMovieQuaternion = Quaternion.normalize({
    x: q[0]!,
    y: q[1]!,
    z: q[2]!,
    w: q[3]!,
  });
  return [n.x, n.y, n.z, n.w];
};

/**
 * The clip's own shape, plus the query time. Duration and `loop` come from the
 * shared contract ({@link clipDurationFault}, {@link clipLoopFault}), so the
 * artifact gate that exists to spare a consumer this throw refuses exactly what
 * would reach it (#1353).
 */
const validateSampleTime: (
  seconds: number,
  duration: number,
  loop: boolean,
) => void = (seconds: number, duration: number, loop: boolean): void => {
  if (!Number.isFinite(seconds))
    throw new Error(`sampleClip seconds must be finite, but was ${seconds}`);
  const fault: IAutoMovieClipShapeFault | null =
    clipDurationFault(duration) ?? clipLoopFault(loop);
  if (fault !== null) throw new Error(`sampleClip clip ${fault.message}`);
};

/**
 * One track's keyframe payload, read through the shared contract. The sampler
 * throws its FIRST fault: reaching an unreadable track means every gate in
 * front of this one let it through, which is an engine defect rather than an
 * authoring one, and one sentence is what a stack trace can carry (#1353).
 */
const validateTrackShape: (
  track: IAutoMovieTrack,
  key: string,
  duration: number,
) => void = (track: IAutoMovieTrack, key: string, duration: number): void => {
  const fault: IAutoMovieClipShapeFault = clipTrackShapeFaults(
    track,
    duration,
  )[0];
  if (fault !== undefined) throw new Error(`track "${key}" ${fault.message}`);
};

/** Clamp (or wrap, when looping) a query time into the clip's duration. */
const normalizeTime: (
  seconds: number,
  duration: number,
  loop: boolean,
) => number = (seconds: number, duration: number, loop: boolean): number => {
  if (duration <= 0) return 0;
  if (loop) {
    const m: number = seconds % duration;
    return m < 0 ? m + duration : m;
  }
  return Math.min(duration, Math.max(0, seconds));
};
