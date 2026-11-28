import { AutoMovieIngestAudio } from "@automovie/ingest";
import { TestValidator } from "@nestia/e2e";

import { createDialogueReceiptFixture } from "../internal/createDialogueReceiptFixture";

/**
 * Converting a WAVE source's rate leaves no spectral image above the source's
 * Nyquist frequency.
 *
 * Scenarios:
 *
 * 1. A 1 s 10 kHz sine at 24 kHz converted to 48 kHz has its largest component
 *    above 12 kHz at least 60 dB below the tone.
 * 2. Converting the same bytes twice gives identical samples.
 * 3. The converted length is round(24000 × 48000 / 24000) = 48000 samples.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the tone, the measured band and the 60 dB requirement, the repeat and the length.
 * @evidence contracts/development/testing.md#behavioral-verification Runs ingest's public decoder on WAVE bytes and measures the output spectrum. Linear interpolation leaves the 14 kHz image of a 10 kHz tone about 20 dB down, so it fails.
 * @evidence contracts/development/testing.md#independent-expectations The 60 dB bound and the 12 kHz edge come from the requirement; the spectrum is a direct DFT under a 4-term Blackman-Harris window, whose −92 dB sidelobes keep the tone's own leakage below the bound.
 */
export function test_ingest_audio_bandlimited_rate(): void {
  const tone: Float32Array = Float32Array.from(
    { length: 24_000 },
    (_: unknown, index: number): number =>
      0.5 * Math.sin((2 * Math.PI * 10_000 * index) / 24_000),
  );
  const { pcm }: ReturnType<typeof createDialogueReceiptFixture> =
    createDialogueReceiptFixture({
      line: "tone",
      text: "tone",
      samples: tone,
      sampleRate: 24_000,
    });
  const decode: () => Float32Array = (): Float32Array =>
    AutoMovieIngestAudio.decodeAsset({
      path: "tone.wav",
      bytes: pcm,
      sampleRate: 48_000,
    }).samples;
  const first: Float32Array = decode();
  const second: Float32Array = decode();

  // A window away from the edges, where the converter sees zeros outside.
  const size: number = 8192;
  const start: number = (first.length - size) / 2;
  const windowed: Float64Array = Float64Array.from(
    { length: size },
    (_: unknown, n: number): number => {
      const phase: number = (2 * Math.PI * n) / (size - 1);
      return (
        first[start + n]! *
        (0.35875 -
          0.48829 * Math.cos(phase) +
          0.14128 * Math.cos(2 * phase) -
          0.01168 * Math.cos(3 * phase))
      );
    },
  );
  const magnitude: (frequency: number) => number = (
    frequency: number,
  ): number => {
    let re: number = 0;
    let im: number = 0;
    for (let n: number = 0; n < size; ++n) {
      const angle: number = (-2 * Math.PI * frequency * n) / 48_000;
      re += windowed[n]! * Math.cos(angle);
      im += windowed[n]! * Math.sin(angle);
    }
    return Math.hypot(re, im);
  };
  const bin: number = 48_000 / size;
  let peak: number = 0;
  for (let f: number = 9_900; f <= 10_100; f += bin / 4)
    peak = Math.max(peak, magnitude(f));
  let image: number = 0;
  for (let k: number = Math.ceil(12_000 / bin); k * bin < 24_000; ++k)
    image = Math.max(image, magnitude(k * bin));
  TestValidator.predicate(
    "no component above 12 kHz within 60 dB of the tone",
    20 * Math.log10(image / peak) <= -60,
  );
  TestValidator.predicate(
    "conversion is deterministic and keeps the rate ratio",
    first.length === 48_000 &&
      first.every((x: number, k: number): boolean => x === second[k]),
  );
}
