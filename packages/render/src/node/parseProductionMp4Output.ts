import type { Movie, createFile } from "mp4box";

import { residentMp4Box } from "./residentMp4Box";

/**
 * Parse delivered or intermediate MP4 bytes under the strict output gate.
 *
 * Admission requires at least 16 bytes, a leading ISO file-type box whose declared size is at least 16 and fits the stream and whose major brand is not blank, a parsed movie box, and no parser error. Throws, in that order, `MP4 output is too short to contain a media track.`, `MP4 output has no leading ISO base-media compatible brand box.`, `MP4 parser rejected output: <detail>` for a parser error or a synchronous parser exception, and `MP4 output has no parsed movie metadata.` Every video probe and the rendered media probe run it before reading a track.
 *
 * This is deliberately not merged with `parseMp4`: that one admits bytes whose fields its callers verify afterwards, sample by sample, while this one refuses a stream that does not announce itself as ISO base media before anything reads a track from it.
 *
 * @evidence contracts/common.md#principled-implementation ISO/IEC 14496-12 requires the file-type box first in a conforming file, so the header is checked by its big-endian size and four-character type before the parser runs; the parse then appends the whole stream at offset zero and flushes, and the movie summary must report a movie box because a track cannot exist without one.
 * @evidence contracts/common.md#clear-and-simple-design One gate decides admission for every probe that reads delivered media, and it normalizes both parser failure channels, the error callback and a thrown exception, into one refusal, so the probes start from a parsed file or a named refusal.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A thrown parser exception is converted into a refusal with its original text, never swallowed, and no brand is required beyond being present, because which brands are acceptable is the delivery profile's question.
 * @evidence contracts/common.md#meaningful-documentation The doc lists every admission condition and each refusal with its message in order, who runs the gate, and why it differs from `parseMp4`.
 * @evidence contracts/performance.md#efficient-algorithms The header gate reads twelve bytes through a view, and copying B encoded bytes costs O(B). One append/flush then delegates box parsing and expanded sample-table construction to mp4box; parsed box and sample populations also drive that work, including compact table counts. No byte-only worst-case guarantee or parsed-population cap is established here.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Callers that need both the parse and a probe pass this parse on to `probeParsedProductionVideoMp4`, and no call re-parses bytes another call already parsed.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned file holds the copied buffer and the parsed box tree until the caller drops it; on refusal everything is local and collectable, and no handle or task is opened.
 */
export const parseProductionMp4Output: (bytes: Uint8Array) => {
    file: ReturnType<typeof createFile>;
    movie: Movie;
} = (
  bytes: Uint8Array,
): { file: ReturnType<typeof createFile>; movie: Movie } => {
  if (bytes.byteLength < 16)
    throw new Error("MP4 output is too short to contain a media track.");
  const header: Buffer = Buffer.from(
    bytes.buffer,
    bytes.byteOffset,
    bytes.byteLength,
  );
  const ftypSize: number = header.readUInt32BE(0);
  if (
    header.toString("ascii", 4, 8) !== "ftyp" ||
    ftypSize < 16 ||
    ftypSize > bytes.byteLength ||
    header.toString("ascii", 8, 12).trim().length === 0
  )
    throw new Error(
      "MP4 output has no leading ISO base-media compatible brand box.",
    );
  const file: ReturnType<typeof createFile> = residentMp4Box().createFile();
  const errors: string[] = [];
  let ready: Movie | null = null;
  file.onError = (module: string, message: string): void => {
    errors.push(`${module}: ${message}`);
  };
  file.onReady = (info: Movie): void => {
    ready = info;
  };
  try {
    file.appendBuffer(
      residentMp4Box().MP4BoxBuffer.fromArrayBuffer(
        Uint8Array.from(bytes).buffer,
        0,
      ),
      true,
    );
    file.flush();
  } catch (error) {
    throw new Error(`MP4 parser rejected output: ${String(error)}`);
  }
  const movie: Movie = ready ?? file.getInfo();
  if (errors.length !== 0)
    throw new Error(`MP4 parser rejected output: ${errors.join("; ")}`);
  if (movie.hasMoov === false)
    throw new Error("MP4 output has no parsed movie metadata.");
  return { file, movie };
};
