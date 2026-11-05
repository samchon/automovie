import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { FilmPlan } from "../shots/kickboxing/ring-bout/FilmPlan";
import { AudioMix } from "./AudioMix";
import { AudioPcm } from "./AudioPcm";
import type { MovieAudio } from "./MovieAudio";
import { MovieAudioAssets } from "./MovieAudioAssets";

/**
 * Write the same fixed complete PCM16 soundtrack that the Viewer prepares.
 *
 * @evidence contracts/common.md#implementation-and-ownership Node reads the exact adopted derivatives, verifies their hashes through the shared asset owner, and uses the same pure cue and sample kernels as MovieAudio. All required asset outcomes settle before error reporting. The new output path uses exclusive creation, so a failed or repeated delivery cannot silently overwrite an existing file.
 * @evidence contracts/common.md#authoring-interface Pass the complete compiled actual contacts and floor receipts, not event intentions alone. outputPath must be absolute and its parent must already exist. The returned cue and WAV hashes must equal the actual same-session Viewer manifest before publication; this function does not perform listening review.
 */
export async function renderFilmAudioMix(input: {
  /** Complete source-plan absolute events. */ events: readonly FilmPlan.Event[];
  /** Actual compiled participant contacts. */ contacts: readonly AudioMix.Contact[];
  /** Actual compiled mat arrivals, when a fall is requested. */ floorContacts?: readonly AudioMix.FloorContact[];
  /** New absolute soundtrack path with an existing parent. */ outputPath: string;
}): Promise<MovieAudio.Manifest & { path: string }> {
  if (!path.isAbsolute(input.outputPath))
    throw new Error("Soundtrack outputPath must be absolute");
  const cues: AudioMix.Cue[] = AudioMix.build(
    input.events,
    input.contacts,
    input.floorContacts,
  );
  const assets: MovieAudioAssets.Asset[] = MovieAudioAssets.select(cues);
  const results: PromiseSettledResult<Float32Array>[] =
    await Promise.allSettled(
      assets.map(
        async (asset: MovieAudioAssets.Asset): Promise<Float32Array> =>
          MovieAudioAssets.decode(asset, await readFile(new URL(asset.url))),
      ),
    );
  const sources: Map<AudioMix.Source, Float32Array> = new Map<
    AudioMix.Source,
    Float32Array
  >();
  const errors: string[] = [];
  results.forEach(
    (result: PromiseSettledResult<Float32Array>, index: number): void => {
      if (result.status === "rejected")
        errors.push(`${assets[index].id}: ${String(result.reason)}`);
      else sources.set(assets[index].id, result.value);
    },
  );
  if (errors.length > 0) throw new Error(errors.join("; "));
  const mixed: ReturnType<typeof AudioMix.render> = AudioMix.render(
    cues,
    sources,
  );
  const bytes: Uint8Array = AudioPcm.encode(mixed.left, mixed.right);
  const sha256: string = await MovieAudioAssets.digest(bytes);
  const cueDigest: string = await MovieAudioAssets.digest(
    new TextEncoder().encode(JSON.stringify(cues)),
  );
  await writeFile(input.outputPath, bytes, { flag: "wx" });
  return {
    path: input.outputPath,
    durationSeconds: 180,
    sampleRate: 48000,
    channels: 2,
    sha256,
    cueDigest,
    peak: mixed.peak,
    cues,
    assets: assets.map(
      (
        asset: MovieAudioAssets.Asset,
      ): { id: AudioMix.Source; sha256: string } => ({
        id: asset.id,
        sha256: asset.sha256,
      }),
    ),
  };
}
