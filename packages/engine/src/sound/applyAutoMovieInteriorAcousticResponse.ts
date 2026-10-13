import { IAutoMovieProductionAcousticResponse } from "@automovie/interface";
/** Fixed internal diffuse-response tier: 20 ms taps, at most 32 and 2 s. */
const TAP_INTERVAL_SECONDS: number = 0.02;

/** Maximum delayed contributions in this sparse tier; a module scalar, not a retained impulse-response buffer. */
const MAX_TAPS: number = 32;

/** Tail ceiling in seconds; caller PCM length still controls the main output allocation. */
const MAX_TAIL_SECONDS: number = 2;

/**
 * Apply an available declared room-path response to finite interleaved PCM.
 *
 * @evidence contracts/common.md#principled-implementation Outdoor copies input, partition response multiplies by admitted gain, and same-room adds at most 32 delayed taps at nearest-sample 20ms spacing (at least one sample), with 10^(-3t/T60) decay and a tail bounded by two seconds; this sparse tier is not a measured impulse-response reconstruction.
 * @evidence contracts/common.md#clear-and-simple-design One PCM owner consumes the closed room-path receipt without decoding adopted bytes or recomputing room geometry; unavailable outcomes throw before an output is published.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Finite input, channel shape and response quantities are admitted explicitly; Float32 accumulation can still overflow for sufficiently large finite input amplitudes, so input finiteness alone does not certify finite output.
 * @evidence contracts/common.md#meaningful-documentation States path-specific gain/tail policy, fresh output and refusal effects; source sample-rate provenance and geometric response derivation belong to the caller.
 * @evidence contracts/performance.md#efficient-algorithms N interleaved samples and T<=32 taps cost O(N*T) same-room work with O(N+sampleRate*tail*channels) output storage; outdoor/partition paths scan/copy O(N).
 * @evidence contracts/performance.md#reuse-equivalent-work Each delayed tap gain/offset is computed once for its full sample traversal, and one supplied response serves the whole generation; no PCM or response cache persists between calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the fresh PCM result, input is read without mutation, and local tap state retains no decoder, adopted bytes, process or audio device.
 * @author Samchon
 */
export const applyAutoMovieInteriorAcousticResponse: (props: { samples: Float32Array<ArrayBufferLike>; channels: number; sampleRate: number; response: IAutoMovieProductionAcousticResponse; }) => Float32Array<ArrayBufferLike> = (props: {
  /** Input interleaved PCM. */
  samples: Float32Array;
  /** Positive channel count. */
  channels: number;
  /** Positive sample rate. */
  sampleRate: number;
  /** Shared event room-path result. */
  response: IAutoMovieProductionAcousticResponse;
}): Float32Array => {
  if (!Number.isSafeInteger(props.channels) || props.channels <= 0)
    throw new Error("acoustic response channels must be a positive integer");
  if (!Number.isSafeInteger(props.sampleRate) || props.sampleRate <= 0)
    throw new Error("acoustic response sample rate must be a positive integer");
  if (props.samples.length % props.channels !== 0)
    throw new Error("acoustic response PCM must contain complete frames");
  if (props.samples.length === 0)
    throw new Error("acoustic response PCM must not be empty");
  if (props.samples.some((sample: number): boolean => !Number.isFinite(sample)))
    throw new Error("acoustic response PCM samples must be finite");
  if (props.response.status !== "available")
    throw new Error(
      `cannot mix ${props.response.status} room response: ${props.response.reason}`,
    );
  if (props.response.path === "outdoor")
    return Float32Array.from(props.samples);
  if (props.response.path === "different-room") {
    const gain: number | null = props.response.transmissionGain;
    if (!Number.isFinite(gain) || gain === null || gain < 0 || gain > 1)
      throw new Error(
        "different-room response needs a transmission gain in [0, 1]",
      );
    return Float32Array.from(props.samples, (sample: number): number => sample * gain);
  }

  const reverberation: number | null = props.response.reverberationTimeSeconds;
  const ratio: number | null = props.response.directToDiffuseRatio;
  if (
    !Number.isFinite(reverberation) ||
    reverberation === null ||
    reverberation <= 0
  )
    throw new Error("same-room response needs a positive reverberation time");
  if (!Number.isFinite(ratio) || ratio === null || ratio <= 0)
    throw new Error(
      "same-room response needs a positive direct-to-diffuse ratio",
    );
  const interval: number = Math.max(
    1,
    Math.round(TAP_INTERVAL_SECONDS * props.sampleRate),
  );
  const tail: number = Math.min(MAX_TAIL_SECONDS, reverberation);
  const taps: number = Math.min(
    MAX_TAPS,
    Math.floor((tail * props.sampleRate) / interval),
  );
  const output: Float32Array<ArrayBuffer> = new Float32Array(
    props.samples.length + taps * interval * props.channels,
  );
  output.set(props.samples);
  const wetGain: number = Math.min(1, 1 / Math.sqrt(ratio));
  for (let tap: number = 1; tap <= taps; ++tap) {
    const seconds: number = (tap * interval) / props.sampleRate;
    const gain: number = wetGain * Math.pow(10, (-3 * seconds) / reverberation);
    const offset: number = tap * interval * props.channels;
    for (let index: number = 0; index < props.samples.length; ++index)
      output[index + offset] += props.samples[index]! * gain;
  }
  return output;
};
