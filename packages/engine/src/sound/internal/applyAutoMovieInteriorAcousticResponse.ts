import type { IAutoMovieApplyInteriorAcousticResponse } from "@automovie/interface";

/** Fixed internal diffuse-response tier: 20 ms taps, at most 32 and 2 s. */
const TAP_INTERVAL_SECONDS: number = 0.02;

/**
 * Maximum delayed contributions in this sparse tier; a module scalar, not a
 * retained impulse-response buffer.
 */
const MAX_TAPS: number = 32;

/**
 * Tail ceiling in seconds; caller PCM length still controls the main output
 * allocation.
 */
const MAX_TAIL_SECONDS: number = 2;

/** Apply an available declared room-path response to finite interleaved PCM. */
export const applyAutoMovieInteriorAcousticResponse: (
  props: IAutoMovieApplyInteriorAcousticResponse.IProps,
) => Float32Array<ArrayBufferLike> = (
  props: IAutoMovieApplyInteriorAcousticResponse.IProps,
): Float32Array => {
  if (props.channels <= 0)
    throw new Error("acoustic response channels must be a positive integer");
  if (props.sampleRate <= 0)
    throw new Error("acoustic response sample rate must be a positive integer");
  if (props.samples.length % props.channels !== 0)
    throw new Error("acoustic response PCM must contain complete frames");
  if (props.samples.length === 0)
    throw new Error("acoustic response PCM must not be empty");

  if (props.response.status !== "available")
    throw new Error(
      `cannot mix ${props.response.status} room response: ${props.response.reason}`,
    );
  if (props.response.path === "outdoor")
    return Float32Array.from(props.samples);
  if (props.response.path === "different-room") {
    const gain: number | null = props.response.transmissionGain;
    if (gain === null || gain < 0 || gain > 1)
      throw new Error(
        "different-room response needs a transmission gain in [0, 1]",
      );
    return Float32Array.from(
      props.samples,
      (sample: number): number => sample * gain,
    );
  }

  const reverberation: number | null = props.response.reverberationTimeSeconds;
  const ratio: number | null = props.response.directToDiffuseRatio;
  if (reverberation === null || reverberation <= 0)
    throw new Error("same-room response needs a positive reverberation time");
  if (ratio === null || ratio <= 0)
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
