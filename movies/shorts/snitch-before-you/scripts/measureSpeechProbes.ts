import {
  type IAutoMovieDecodedProductionAudioAsset,
  decodeProductionAudioAsset,
} from "@automovie/ingest";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Measure fixed mono 48 kHz speech probes through the installed WAVE decoder.
 *
 * Run with an output JSON path followed by one or more input WAV paths. All
 * inputs must decode before the report is written. Measurements describe saved
 * bytes and untrimmed container duration, never transcript or listening approval.
 * The reconstructed generation/source chain is recorded in
 * docs/prompts/voices/quidditch-rescue-dialogue.md; retention and restoration
 * live in docs/analysis/generation-handoff.md. This command measures existing
 * files and never generates, moves or edits the retained audio.
 * The public decoder owns format validation; this host hashes original bytes,
 * requires the probe profile, and computes sample peak, RMS and saturation count.
 * Files are read sequentially and released by readFile; memory holds one decoded
 * take and the small report population, with no persistent process or resource.
 */
export async function measureSpeechProbes(args: string[]): Promise<void> {
  const output: string | undefined = args[0];
  const inputs: string[] = args.slice(1);
  if (output === undefined || inputs.length === 0)
    throw new Error("Supply output.json and at least one fixed WAV path");

  const measurements: {
    path: string;
    sha256: string;
    frames: number;
    sampleRate: number;
    channels: number;
    durationSeconds: number;
    peak: number;
    rms: number;
    saturatedSamples: number;
    listening: string;
  }[] = [];
  for (const input of inputs) {
    const absolute: string = path.resolve(input);
    const bytes: Buffer = await readFile(absolute);
    const decoded: IAutoMovieDecodedProductionAudioAsset =
      decodeProductionAudioAsset({
        path: absolute,
        bytes,
        sampleRate: 48000,
      });
    if (
      decoded.sourceSampleRate !== 48000 ||
      decoded.sourceChannels !== 1 ||
      decoded.sourceFrames === 0
    )
      throw new Error(`Expected nonempty mono 48 kHz probe: ${absolute}`);

    let peak: number = 0;
    let squareSum: number = 0;
    let saturatedSamples: number = 0;
    for (const sample of decoded.samples) {
      const amplitude: number = Math.abs(sample);
      peak = Math.max(peak, amplitude);
      squareSum += sample * sample;
      if (amplitude >= 32767 / 32768) saturatedSamples += 1;
    }
    measurements.push({
      path: absolute.replaceAll("\\", "/"),
      sha256: createHash("sha256").update(bytes).digest("hex"),
      frames: decoded.sourceFrames,
      sampleRate: decoded.sourceSampleRate,
      channels: decoded.sourceChannels,
      durationSeconds: decoded.durationSeconds,
      peak,
      rms: Math.sqrt(squareSum / decoded.samples.length),
      saturatedSamples,
      listening: "unverified; measurement does not establish hearing or words",
    });
  }

  await writeFile(
    path.resolve(output),
    `${JSON.stringify({ decoder: "@automovie/ingest", measurements }, null, 2)}\n`,
  );
  console.log(JSON.stringify(measurements, null, 2));
}

void measureSpeechProbes(process.argv.slice(2)).catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
