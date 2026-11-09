import { decodeProductionAudioAsset } from "@automovie/ingest";
import {
  encodeAutoMovieWavPcm16,
  mixAutoMovieAudioPcm,
} from "@automovie/render";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

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
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Mix WAV assets into one stereo 16-bit PCM WAV soundtrack, usable as `renderViewerVideo`'s `audioMix`) and documents the returned value as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Mix WAV assets into one stereo 16-bit PCM WAV soundtrack, usable as `renderViewerVideo`'s `audioMix`) directly over its typed inputs (`input`) as nested iteration of depth 2 (for-of over new Set( input.cues.map((c: mixAutoM; map over input.cues), delegating to `decodeProductionAudioAsset`, `readFile`, `mixAutoMovieAudioPcm`, `Math.round`, `encodeAutoMovieWavPcm16`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (1 throw site). Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One async operation of 36 lines and 7 top-level statements that reuses `decodeProductionAudioAsset`, `readFile`, `mixAutoMovieAudioPcm`, `Math.round`, `encodeAutoMovieWavPcm16` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `input`; the dominant cost is nested iteration of depth 2 (for-of over new Set( input.cues.map((c: mixAutoM; map over input.cues), performed once per call with 12 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Awaits 3 calls per invocation and shares no result or in-flight work between invocations: equivalence of effectful calls is not decided here, so every call repeats its effects.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The body touches I/O, timers, listeners or process state; it retains nothing after it settles beyond its result, and any handle it opens is owned and released by the call or by its callees.
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
