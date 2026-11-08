import { decodeProductionAudioAsset } from "@automovie/ingest";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { encodeAutoMovieWavPcm16 } from "../audio/encodeAutoMovieWavPcm16";
import { mixAutoMovieAudioPcm } from "../audio/mixAutoMovieAudioPcm";

/**
 * Mix WAV assets into one stereo 16-bit PCM WAV soundtrack, usable as
 * `renderViewerVideo`'s `audioMix`.
 *
 * A thin file shell over the pure laws: every referenced asset is read once
 * and decoded by the public Ingest decoder (16-bit PCM or 32-bit float, mono
 * or stereo folded to mono, resampled linearly to the output rate), the cues
 * are summed by {@link mixAutoMovieAudioPcm} into `round(durationSeconds *
 * sampleRate)` frames, and the result is encoded by
 * {@link encodeAutoMovieWavPcm16}. Unreferenced assets are not read. The
 * output and its SHA-256 are deterministic for equal inputs.
 *
 * @returns The written path and the SHA-256 of its bytes.
 */
export async function mixAutoMovieAudioCues(input: {
  /** Output samples per second. */ sampleRate: number;
  /** Output length, seconds; positive. */ durationSeconds: number;
  /** WAV file path by asset id. */ assets: Readonly<Record<string, string>>;
  /** The cues, as {@link mixAutoMovieAudioPcm.ICue}. */ cues: readonly mixAutoMovieAudioPcm.ICue[];
  /** Output WAV path; its directory is created. */ outputPath: string;
  /** Linear gain on every cue; 1 by default. */ master?: number;
  /** Edge fade, seconds; 0.004 by default. */ fadeSeconds?: number;
}): Promise<{ path: string; sha256: string }> {
  const sources: Record<string, Float32Array> = {};
  for (const id of new Set(
    input.cues.map((c: mixAutoMovieAudioPcm.ICue): string => c.asset),
  )) {
    const file: string | undefined = input.assets[id];
    if (file === undefined)
      throw new Error(`Audio cue names an unknown asset: ${id}`);
    sources[id] = decodeProductionAudioAsset({
      path: file,
      bytes: new Uint8Array(await readFile(file)),
      sampleRate: input.sampleRate,
    }).samples;
  }
  const mixed: ReturnType<typeof mixAutoMovieAudioPcm> = mixAutoMovieAudioPcm({
    sampleRate: input.sampleRate,
    frames: Math.round(input.durationSeconds * input.sampleRate),
    sources,
    cues: input.cues,
    ...(input.master === undefined ? {} : { master: input.master }),
    ...(input.fadeSeconds === undefined
      ? {}
      : { fadeSeconds: input.fadeSeconds }),
  });
  const bytes: Uint8Array = encodeAutoMovieWavPcm16(
    mixed.left,
    mixed.right,
    input.sampleRate,
  );
  await mkdir(path.dirname(input.outputPath), { recursive: true });
  await writeFile(input.outputPath, bytes);
  return {
    path: input.outputPath,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
}
