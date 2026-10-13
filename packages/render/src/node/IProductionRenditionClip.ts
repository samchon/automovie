import type { IAutoMovieProductionVideoProbe } from "@automovie/interface";
import type { Sample, Track } from "mp4box";

/**
 * One H.264 MP4 clip parsed for splicing without decoding it, as
 * `parseProductionRenditionClip` returns it.
 *
 * Its bytes, probe, track, samples, constant sample duration and the decode and
 * presentation origins its samples are re-timed from travel together, because
 * `appendLosslessVideoClip` and the splice proofs read all of them. Times are
 * integer ticks of the clip's own media timescale, `track.timescale`. A record
 * built by `parseProductionRenditionClip` has `decodeStart` 0 and
 * presentation times that are a permutation of whole sample durations from
 * `presentationStart`; a deterministic slice built by
 * `conformProductionVisualDeliveryVideoMp4` keeps the parent's bytes, probe
 * and track and narrows `samples` and both origins to its range.
 *
 * @evidence contracts/common.md#principled-implementation The record keeps the parser's own `Track` and `Sample` objects and the source bytes, so a splice copies each sample's exact byte range and re-times it from the two origins rather than re-deriving anything from decoded pictures.
 * @evidence contracts/common.md#clear-and-simple-design One record per clip carries the facts every splice path reads together, so the parser computes the origins and sample duration once instead of each consumer recomputing them.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The fields are parser observations; no field is defaulted or adjusted for a particular clip, and a slice changes only the sample range and its origins.
 * @evidence contracts/common.md#meaningful-documentation The doc names the producer and readers, the time unit, the guarantees a parsed record carries, how a deterministic slice differs, and each member states what it holds.
 * @evidenceExclude contracts/performance.md#efficient-algorithms An interface holds parsed values and runs no algorithm; parsing cost is answered on its producer.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The record is itself the shared parse result that the splice writer and proofs read, so it declares no further work to reuse.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The record retains the whole clip byte array, its probe and the parser's sample table for as long as a splice holds the record; it opens no file handle or task.
 */
export interface IProductionRenditionClip {
  /** The clip's exact MP4 bytes, which every copied sample is read out of. */
  bytes: Uint8Array;

  /** Parser-observed container facts of this clip. */
  probe: IAutoMovieProductionVideoProbe;

  /** The clip's single video track as the MP4 parser reports it. */
  track: Track;

  /** The samples to splice, in decode order, with offsets into `bytes`. */
  samples: Sample[];

  /** The one sample duration, in media ticks, that every sample carries. */
  sampleDuration: number;

  /** Decode time, in media ticks, of the first sample in `samples`. */
  decodeStart: number;

  /** Smallest presentation time, in media ticks, among `samples`. */
  presentationStart: number;
}
