


/**
 * The plan for stitching encoded chunk videos back into one video with ffmpeg's concat demuxer and stream copy.
 *
 * The host writes `concatListLines` to `concatListPath` and runs ffmpeg with `ffmpegArgs`. The list holds chunk basenames because the demuxer resolves a relative entry against the list file's directory, which is also the chunk outputs' directory. Successful stream-copy concatenation requires the host's actual encoded streams to be compatible; a planned argument vector alone does not prove that condition.
 *
 * @evidence contracts/common.md#principled-implementation The concat demuxer and stream-copy arguments request joining without re-encoding, under the host's premise that actual chunk streams have compatible parameters. The planner supplies one render spec for their argument vectors but does not inspect encoded bytes here; basename entries resolve relative to the list file's directory.
 * @evidence contracts/common.md#clear-and-simple-design The plan gives the list path, its exact lines and the argument vector, so the host only writes one file and spawns one process with no path logic of its own.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts `-safe 0` is ffmpeg's documented switch for accepting arbitrary entry names, needed because chunk basenames may contain characters the safe mode rejects, and no output name is special-cased.
 * @evidence contracts/common.md#meaningful-documentation The prose states the host's two steps and why entries are basenames; members state order, the line format and that the arguments copy streams.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This interface is a data shape whose construction cost belongs to the chunk planner.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The reassembly plan coordinates no repeated work; the host runs it once after every chunk is encoded.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased reassembly interface acquires no list file or process. planChunkedSequenceRender creates chunk-count paths and concat lines retained by its caller; the host owns writing that list and the ffmpeg process and must complete their cleanup.
 * @author Samchon
 */
export interface IAutoMovieRenderReassembly {
  /** Final video path, the whole plan's `outputPath`. */
  outputPath: string;

  /** Chunk output video paths, in play order. */
  chunkOutputs: string[];

  /** Path of the concat-demuxer list file the host writes, beside the output. */
  concatListPath: string;

  /**
   * Lines of that list, `file '<basename>'` with each apostrophe escaped, in play order.
   */
  concatListLines: string[];

  /** Ffmpeg argument vector that concatenates the chunk videos with stream copy. */
  ffmpegArgs: string[];
}
