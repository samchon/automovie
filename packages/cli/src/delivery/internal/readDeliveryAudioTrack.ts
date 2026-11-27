import { AutoMovieMp4Boxes } from "./AutoMovieMp4Boxes";
import type { IAutoMovieDeliveryAudioTrack } from "./IAutoMovieDeliveryAudioTrack";

/*
 * Reads how much of an audio track an MP4 file presents, from the container's
 * own sample table and edit list.
 *
 * An AAC decoder returns whole 1024-sample frames, so the final decoded frame
 * can run past the soundtrack. The container records where presentation ends:
 * the sample table gives the exact media end, with a shortened last sample, and
 * the edit list gives the encoder priming skipped at the start. The edit's
 * duration is stored in the coarser movie clock, so an edit ending within one
 * movie tick of the media end is that end rounded (2133.33 ms is written as
 * 2133 ms). Only an edit ending a whole movie tick or more earlier trims the
 * track. The presented duration is that end less the skipped priming.
 * Parameter path: The delivery file whose bytes are audited.
 * Parameter streamIndex: FFmpeg's input stream index, which counts the file's
 * tracks in order.
 * Returns: The presented duration in the track's media clock, or why it is
 * unknown.
 */
export async function readDeliveryAudioTrack(
  path: string,
  streamIndex: number,
): Promise<IAutoMovieDeliveryAudioTrack> {
  try {
    const { movie } = await AutoMovieMp4Boxes.read(path);
    return movie === undefined
      ? { status: "uncovered", reason: "The delivery has no MP4 movie box" }
      : presentation(movie, streamIndex);
  } catch (error) {
    return {
      status: "uncovered",
      reason:
        "The delivery's MP4 audio timing could not be read: " +
        (error instanceof Error ? error.message : String(error)),
    };
  }
}

/*
 * The box readers the reader walks the movie box with.
 */
const {
  children,
  clock,
  edits,
  field,
  handler,
  only,
}: typeof AutoMovieMp4Boxes = AutoMovieMp4Boxes;

/*
 * Combines the selected track's edit list and sample table.
 */
function presentation(
  movie: Buffer,
  streamIndex: number,
): IAutoMovieDeliveryAudioTrack {
  const root: AutoMovieMp4Boxes.IBox = {
    type: "moov",
    start: 0,
    end: movie.length,
  };
  const movieClock: bigint = BigInt(
    clock(movie, only(movie, root, "mvhd")).timescale,
  );
  const track: AutoMovieMp4Boxes.IBox | undefined = children(
    movie,
    root.start,
    root.end,
  ).filter((box: AutoMovieMp4Boxes.IBox): boolean => box.type === "trak")[
    streamIndex
  ];
  if (track === undefined)
    return { status: "uncovered", reason: "The audio track is not listed" };
  if (handler(movie, track) !== "soun")
    return { status: "uncovered", reason: "The selected track is not audio" };
  const media: AutoMovieMp4Boxes.IBox = only(movie, track, "mdia");
  const mediaClock: bigint = BigInt(
    clock(movie, only(movie, media, "mdhd")).timescale,
  );

  const table: AutoMovieMp4Boxes.IBox = only(
    movie,
    only(movie, only(movie, media, "minf"), "stbl"),
    "stts",
  );
  const entries: number = movie.readUInt32BE(field(table, 4, 4));
  let mediaEnd: bigint = 0n;
  for (let entry: number = 0; entry < entries; ++entry) {
    const at: number = field(table, 8 + entry * 8, 8);
    mediaEnd +=
      BigInt(movie.readUInt32BE(at)) * BigInt(movie.readUInt32BE(at + 4));
  }

  let skipped: bigint = 0n;
  let end: bigint = mediaEnd;
  const list: AutoMovieMp4Boxes.IEdit[] = edits(movie, track);
  if (list.length !== 0) {
    if (list.length !== 1)
      return {
        status: "uncovered",
        reason: "The audio track has other than one edit",
      };
    const edit: AutoMovieMp4Boxes.IEdit = list[0]!;
    const segment: bigint = edit.segmentDuration;
    skipped = edit.mediaTime;
    if (
      skipped < 0n ||
      segment === 0n ||
      edit.mediaRateInteger !== 1 ||
      edit.mediaRateFraction !== 0
    )
      return {
        status: "uncovered",
        reason: "The audio edit is empty, unbounded or not at unit rate",
      };
    // The segment is quantized to the movie clock. Within one movie tick of
    // the media end it is that end rounded; only a shorter edit trims.
    if ((mediaEnd - skipped) * movieClock - segment * mediaClock >= mediaClock)
      end =
        skipped + (segment * mediaClock * 2n + movieClock) / (movieClock * 2n);
  }
  const duration: bigint = end - skipped;
  if (
    duration <= 0n ||
    duration > BigInt(Number.MAX_SAFE_INTEGER) ||
    mediaClock > BigInt(Number.MAX_SAFE_INTEGER)
  )
    return {
      status: "uncovered",
      reason: "The audio track presents no safe positive duration",
    };
  return {
    status: "read",
    timescale: Number(mediaClock),
    duration: Number(duration),
  };
}
