import type { IAutoMovieAnalysisRun, IAutoMovieProductionAcousticResponse } from "@automovie/interface";

/**
 * Apply the shared bounded room-path result to finite, non-empty interleaved
 * PCM.
 *
 * Outdoor input is copied exactly. Different-room input applies only the
 * declared transmission gain. Same-room input adds deterministic diffuse taps
 * at a fixed 20 ms interval, capped at 32 taps and two seconds, decaying to -60
 * dB at T60. This is a staging proxy, not a measured impulse response.
 *
 * @evidence requirements/sound/interior-acoustics.md#sound-bounded-room-response Applies a finite deterministic internal response tier.
 * @evidence specifications/simulation-effects-and-sound/ambience-music-spatial-and-acoustics.md#bounded-acoustic-response-and-provider-adoption Bounds tap count and tail duration.
 * @evidence requirements/sound/interior-acoustics.md#sound-acoustic-claim-boundary Refuses unavailable responses instead of treating them as dry success.
 * @evidence specifications/simulation-effects-and-sound/ambience-music-spatial-and-acoustics.md#acoustic-mix-consumption-and-claim-boundary Limits the claim to a broadband proxy.
 */
export const applyAutoMovieInteriorAcousticResponse = (props: {
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
  if (props.samples.some((sample) => !Number.isFinite(sample)))
    throw new Error("acoustic response PCM samples must be finite");
  if (props.response.status !== "available")
    throw new Error(
      `cannot mix ${props.response.status} room response: ${props.response.reason}`,
    );
  if (props.response.path === "outdoor")
    return Float32Array.from(props.samples);
  if (props.response.path === "different-room") {
    const gain = props.response.transmissionGain;
    if (!Number.isFinite(gain) || gain === null || gain < 0 || gain > 1)
      throw new Error(
        "different-room response needs a transmission gain in [0, 1]",
      );
    return Float32Array.from(props.samples, (sample) => sample * gain);
  }

  const reverberation = props.response.reverberationTimeSeconds;
  const ratio = props.response.directToDiffuseRatio;
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
  const interval = Math.max(
    1,
    Math.round(TAP_INTERVAL_SECONDS * props.sampleRate),
  );
  const tail = Math.min(MAX_TAIL_SECONDS, reverberation);
  const taps = Math.min(
    MAX_TAPS,
    Math.floor((tail * props.sampleRate) / interval),
  );
  const output = new Float32Array(
    props.samples.length + taps * interval * props.channels,
  );
  output.set(props.samples);
  const wetGain = Math.min(1, 1 / Math.sqrt(ratio));
  for (let tap = 1; tap <= taps; ++tap) {
    const seconds = (tap * interval) / props.sampleRate;
    const gain = wetGain * Math.pow(10, (-3 * seconds) / reverberation);
    const offset = tap * interval * props.channels;
    for (let index = 0; index < props.samples.length; ++index)
      output[index + offset] += props.samples[index]! * gain;
  }
  return output;
};

const metricValue = (
  metrics: Extract<
    IAutoMovieAnalysisRun["outcome"],
    { status: "solved" }
  >["metrics"],
  key: string,
): number | null => metrics.find((metric) => metric.key === key)!.value ?? null;

const metricGap = (
  metrics: Extract<
    IAutoMovieAnalysisRun["outcome"],
    { status: "solved" }
  >["metrics"],
  key: string,
): string => metrics.find((candidate) => candidate.key === key)!.gap!.reason;

const DIGEST_PATTERN = /^sha256:[0-9a-f]{64}$/u;

/** Fixed internal diffuse-response tier: 20 ms taps, at most 32 and 2 s. */
const TAP_INTERVAL_SECONDS = 0.02;

const MAX_TAPS = 32;

const MAX_TAIL_SECONDS = 2;
