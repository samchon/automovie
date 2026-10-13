import type { IAutoMovieProductionMediaProbe } from "@automovie/interface";
import type { Movie, createFile } from "mp4box";

import { probeVideoTrack } from "./probeVideoTrack";

/**
 * Probe one already-parsed MP4, `parsed` from `bytes`, as a file whose only
 * track is one H.264 video track.
 *
 * Throws `Production video MP4 contains <n> video tracks; exactly one is
 * required.` or `... <n> total tracks; exactly one is required.` before the
 * track is read, then whatever `probeVideoTrack` refuses. Callers pass the
 * result of `parseProductionMp4Output` for the same bytes, so the strict
 * container gate has already run.
 *
 * @evidence contracts/common.md#principled-implementation The two track counts are read from the parser's movie summary, which lists every track of the `moov` box, so a file with an extra audio, text or data track is refused before the video reading starts.
 * @evidence contracts/common.md#clear-and-simple-design The standalone video probe, the rendered-media probe's guide-pass arm, the feature mux and the splice clip parser need the same single-track rule and differ only in whether they already hold the parse, so the parsed form is the shared one and `probeProductionVideoMp4` parses and delegates.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No track kind is ignored to make a file fit, and the track is read by the same `probeVideoTrack` every other video reading uses.
 * @evidence contracts/common.md#meaningful-documentation The doc states the single-track condition, both refusals, the delegated refusals and the parse callers are expected to supply.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Two length checks precede the delegated reading, whose cost is answered on `probeVideoTrack`.
 * @evidence contracts/performance.md#reuse-equivalent-work Taking the parse as an argument lets a caller that already parsed the bytes, such as the feature mux or the clip parser, reuse that parse instead of parsing again; equivalence holds because the caller passes the parse of the same `bytes`.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The function retains nothing; the parse stays the caller's and the returned record holds no parser object.
 */
export const probeParsedProductionVideoMp4 = (
  bytes: Uint8Array,
  parsed: { file: ReturnType<typeof createFile>; movie: Movie },
): Extract<IAutoMovieProductionMediaProbe, { kind: "video" }> => {
  if (parsed.movie.videoTracks.length !== 1)
    throw new Error(
      `Production video MP4 contains ${parsed.movie.videoTracks.length} video tracks; exactly one is required.`,
    );
  if (parsed.movie.tracks.length !== 1)
    throw new Error(
      `Production video MP4 contains ${parsed.movie.tracks.length} total tracks; exactly one is required.`,
    );
  return probeVideoTrack(bytes, parsed.file, parsed.movie.videoTracks[0]!);
};
