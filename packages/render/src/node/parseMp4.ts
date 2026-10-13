import type { Movie, createFile } from "mp4box";

import { residentMp4Box } from "./residentMp4Box";

/**
 * Parse MP4 bytes in one pass and answer with the parsed file and its movie
 * summary.
 *
 * Errors the parser reports through its error callback are collected and
 * thrown together as `MP4 parser rejected input: <module>: <message>; ...`; an
 * exception the parser throws synchronously propagates unchanged. When the
 * parser never reports a ready movie, the summary is read from the file as
 * parsed, so a file without a movie box yields a summary with no tracks rather
 * than a refusal.
 *
 * Callers either probed the bytes already or verify the parsed fields
 * themselves afterwards, which is why this admits a stream the delivered-output
 * gate would refuse. It is deliberately not merged with
 * `parseProductionMp4Output`: that one is the strict delivery gate, and
 * requiring its leading file-type box and parsed movie header here would
 * refuse inputs these writers compare sample by sample before trusting
 * anything about them.
 *
 * @evidence contracts/common.md#principled-implementation The whole stream is appended at file offset zero and flushed, which mp4box documents as the way to parse a complete in-memory file; the bytes are copied into a fresh `ArrayBuffer` because the parser takes an `ArrayBuffer` it tags with its file offset and keeps, and the caller's array may be a view or shared memory.
 * @evidence contracts/common.md#clear-and-simple-design The normalizer, the feature mux and the two splice proofs share this permissive parse and apply their own checks, while the strict gate stays separate for the reason the doc gives.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every parser error refuses the input; none is filtered, and nothing on the parser is replaced, its callbacks being the published hooks for these events.
 * @evidence contracts/common.md#meaningful-documentation The doc states what is returned, the refusal and its message, that synchronous exceptions propagate, how a missing movie reads, and why this parse is not the strict gate.
 * @evidence contracts/performance.md#efficient-algorithms The parse is one sequential pass over the bytes after one copy, so time and memory are linear in the file size.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each caller parses bytes it was just handed or just wrote, so no earlier parse of the same bytes exists to reuse.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned file holds the copied buffer and the parsed box tree until the caller drops it, about the input size plus its sample tables; the parser opens no handle or task.
 */
export const parseMp4 = (
  bytes: Uint8Array,
): { file: ReturnType<typeof createFile>; movie: Movie } => {
  const file: ReturnType<typeof createFile> = residentMp4Box().createFile();
  let movie: Movie | null = null;
  const errors: string[] = [];
  file.onReady = (value: Movie): void => {
    movie = value;
  };
  file.onError = (module: string, message: string): void => {
    errors.push(`${module}: ${message}`);
  };
  file.appendBuffer(
    residentMp4Box().MP4BoxBuffer.fromArrayBuffer(
      Uint8Array.from(bytes).buffer,
      0,
    ),
    true,
  );
  file.flush();
  if (errors.length !== 0)
    throw new Error(`MP4 parser rejected input: ${errors.join("; ")}`);
  return { file, movie: movie ?? file.getInfo() };
};
