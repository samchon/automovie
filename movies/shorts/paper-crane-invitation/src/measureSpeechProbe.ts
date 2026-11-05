import {
  type IAutoMovieDecodedProductionAudioAsset,
  decodeProductionAudioAsset,
} from "@automovie/ingest";
import { createHash } from "node:crypto";

/**
 * Measure saved mono 48 kHz candidate speech without changing its bytes.
 *
 * The installed decoder validates RIFF/WAVE structure and finite samples. This
 * probe profile additionally requires nonempty mono 48 kHz input, so sample
 * statistics use the original rate without downmix or resampling. Duration is
 * the complete container runtime, including silence. Full-scale sample counts
 * locate technical candidates; neither they nor RMS establish audible quality,
 * transcript correctness or final timing suitability. The caller owns bytes and
 * result; this linear scan retains no asset or resource after returning.
 *
 * @evidence contracts/common.md#implementation-and-ownership The public Ingest decoder owns format and finite-sample validation; this production requires its exact probe profile, hashes original bytes and computes untrimmed duration/peak/RMS/full-scale count in one sample scan, without claiming listening or transcript acceptance.
 * @evidence contracts/common.md#authoring-interface Supply one complete original WAV and diagnostic identity. Returns immutable-by-convention measurements; throws for unsupported/nonfinite WAVE or empty/nonmono/non48kHz probe. The script consumer writes provenance and actual output records after all inputs decode.
 */
export function measureSpeechProbe(
  bytes: Uint8Array,
  identity: string,
): {
  sha256: string;
  frames: number;
  sampleRate: number;
  channels: number;
  durationSeconds: number;
  peak: number;
  rms: number;
  fullScaleSamples: number;
} {
  const decoded: IAutoMovieDecodedProductionAudioAsset =
    decodeProductionAudioAsset({ path: identity, bytes, sampleRate: 48000 });
  if (
    decoded.sourceSampleRate !== 48000 ||
    decoded.sourceChannels !== 1 ||
    decoded.sourceFrames === 0
  )
    throw new Error(`Expected nonempty mono 48 kHz candidate: ${identity}`);

  let peak: number = 0;
  let squares: number = 0;
  let fullScaleSamples: number = 0;
  for (const sample of decoded.samples) {
    const amplitude: number = Math.abs(sample);
    peak = Math.max(peak, amplitude);
    squares += sample * sample;
    if (amplitude >= 32767 / 32768) fullScaleSamples += 1;
  }

  return {
    sha256: createHash("sha256").update(bytes).digest("hex"),
    frames: decoded.sourceFrames,
    sampleRate: decoded.sourceSampleRate,
    channels: decoded.sourceChannels,
    durationSeconds: decoded.durationSeconds,
    peak,
    rms: Math.sqrt(squares / decoded.samples.length),
    fullScaleSamples,
  };
}
