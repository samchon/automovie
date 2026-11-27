import { createHash } from "node:crypto";
import * as fs from "node:fs/promises";

import { AutoMovieMp4Boxes } from "./AutoMovieMp4Boxes";
import type { IAutoMovieDeliveryProfileFinding } from "./IAutoMovieDeliveryProfileFinding";

/** The box readers the audit walks the movie box with. */
const { children, field, handler, only }: typeof AutoMovieMp4Boxes =
  AutoMovieMp4Boxes;

/**
 * Check that a transparent render's `.mov` holds the drawn frame files
 * themselves: one video sample per frame, each sample's bytes hashing to its
 * frame file's SHA-256, and no audio track.
 *
 * The samples are located through the video track's sample table (ISO/IEC
 * 14496-12, 8.7): `stsz` gives each size, `stsc` how many samples each chunk
 * holds, and `stco` or `co64` where each chunk starts, samples lying back to
 * back within a chunk. Each sample is read from the file and hashed with
 * SHA-256, then compared with the hash of the frame file at the same index.
 * @see https://www.iso.org/standard/85596.html
 *
 * It returns the findings in the profile-finding form the render report keeps,
 * empty when the file conforms: `track` for an audio track, `sampleCount` for a
 * count other than the frames', `sample[<i>].sha256` for the first sample whose
 * bytes differ, or `probe` when the boxes cannot be read.
 */
export async function auditAutoMovieAlphaSamples(props: {
  /** The wrapped `.mov` file. */
  path: string;

  /** The drawn frame files, in frame order. */
  frames: readonly string[];
}): Promise<IAutoMovieDeliveryProfileFinding[]> {
  let samples: { offset: number; size: number }[];
  let audio: boolean;
  try {
    const file: AutoMovieMp4Boxes.IFile = await AutoMovieMp4Boxes.read(
      props.path,
    );
    if (file.movie === undefined) throw new Error("missing moov box");
    const movie: Buffer = file.movie;
    const tracks: AutoMovieMp4Boxes.IBox[] = children(
      movie,
      0,
      movie.length,
    ).filter((box: AutoMovieMp4Boxes.IBox): boolean => box.type === "trak");
    audio = tracks.some(
      (track: AutoMovieMp4Boxes.IBox): boolean =>
        handler(movie, track) === "soun",
    );
    const videos: AutoMovieMp4Boxes.IBox[] = tracks.filter(
      (track: AutoMovieMp4Boxes.IBox): boolean =>
        handler(movie, track) === "vide",
    );
    if (videos.length !== 1)
      throw new Error(`${videos.length} video tracks where one is required`);
    samples = sampleTable(movie, videos[0]!);
  } catch (error) {
    return [
      {
        media: "video",
        field: "probe",
        expected: "a readable sample table",
        observed: error instanceof Error ? error.message : String(error),
      },
    ];
  }

  const findings: IAutoMovieDeliveryProfileFinding[] = [];
  if (audio)
    findings.push({
      media: "audio",
      field: "track",
      expected: "absent",
      observed: "present",
    });
  if (samples.length !== props.frames.length) {
    findings.push({
      media: "video",
      field: "sampleCount",
      expected: String(props.frames.length),
      observed: String(samples.length),
    });
    return findings;
  }

  // Each sample against its frame file, stopping at the first difference.
  const handle: fs.FileHandle = await fs.open(props.path, "r");
  try {
    for (const [index, sample] of samples.entries()) {
      const bytes: Buffer = Buffer.alloc(sample.size);
      const { bytesRead }: fs.FileReadResult<Buffer> = await handle.read(
        bytes,
        0,
        sample.size,
        sample.offset,
      );
      const observed: string = sha256(bytes.subarray(0, bytesRead));
      const expected: string = sha256(await fs.readFile(props.frames[index]!));
      if (observed !== expected) {
        findings.push({
          media: "video",
          field: `sample[${index}].sha256`,
          expected,
          observed,
        });
        break;
      }
    }
  } finally {
    await handle.close();
  }
  return findings;
}

/**
 * Every sample's file offset and size from a track's `stsz`, `stsc` and `stco`
 * or `co64`.
 */
function sampleTable(
  movie: Buffer,
  track: AutoMovieMp4Boxes.IBox,
): { offset: number; size: number }[] {
  const table: AutoMovieMp4Boxes.IBox = only(
    movie,
    only(movie, only(movie, track, "mdia"), "minf"),
    "stbl",
  );

  // Sizes: one shared size, or one per sample.
  const stsz: AutoMovieMp4Boxes.IBox = only(movie, table, "stsz");
  const shared: number = movie.readUInt32BE(field(stsz, 4, 4));
  const count: number = movie.readUInt32BE(field(stsz, 8, 4));
  const sizes: number[] = Array.from(
    { length: count },
    (_: unknown, index: number): number =>
      shared !== 0
        ? shared
        : movie.readUInt32BE(field(stsz, 12 + index * 4, 4)),
  );

  // Chunk offsets, 32- or 64-bit.
  const stco: AutoMovieMp4Boxes.IBox | undefined = only(
    movie,
    table,
    "stco",
    true,
  );
  const co64: AutoMovieMp4Boxes.IBox | undefined = only(
    movie,
    table,
    "co64",
    true,
  );
  const chunks: number[] = [];
  if (stco !== undefined) {
    const entries: number = movie.readUInt32BE(field(stco, 4, 4));
    for (let index: number = 0; index < entries; index++)
      chunks.push(movie.readUInt32BE(field(stco, 8 + index * 4, 4)));
  } else if (co64 !== undefined) {
    const entries: number = movie.readUInt32BE(field(co64, 4, 4));
    for (let index: number = 0; index < entries; index++)
      chunks.push(Number(movie.readBigUInt64BE(field(co64, 8 + index * 8, 8))));
  } else throw new Error("missing stco or co64 box");

  // Samples per chunk: each `stsc` run applies from its first chunk (1-based)
  // until the next run's.
  const stsc: AutoMovieMp4Boxes.IBox = only(movie, table, "stsc");
  const runs: number = movie.readUInt32BE(field(stsc, 4, 4));
  const firsts: number[] = [];
  const perChunk: number[] = [];
  for (let index: number = 0; index < runs; index++) {
    firsts.push(movie.readUInt32BE(field(stsc, 8 + index * 12, 4)));
    perChunk.push(movie.readUInt32BE(field(stsc, 12 + index * 12, 4)));
  }
  const samples: { offset: number; size: number }[] = [];
  let run: number = 0;
  for (const [chunk, start] of chunks.entries()) {
    while (run + 1 < runs && firsts[run + 1]! <= chunk + 1) run++;
    let offset: number = start;
    for (
      let k: number = 0;
      k < (perChunk[run] ?? 0) && samples.length < count;
      k++
    ) {
      const size: number = sizes[samples.length]!;
      samples.push({ offset, size });
      offset += size;
    }
  }
  if (samples.length !== count)
    throw new Error(
      `the sample table places ${samples.length} of ${count} samples`,
    );
  return samples;
}

/** SHA-256 of bytes as 64 lowercase hexadecimal digits. */
function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}
