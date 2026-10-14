import type { IAutoMovieSequence, IAutoMovieShot } from "@automovie/interface";

/**
 * JSON-transferred capture-page marker, duration seconds, sequence, shots and shot order consumed by sequence capture. The reader checks ready, numeric duration, sequence id and a shots array; it does not deeply validate every shot here, and the ready marker alone does not prove healthy visible geometry or GPU provenance.
 *
 *
 * @evidence contracts/common.md#principled-implementation A JSON copy transfers readiness, duration, sequence and shots from the page; readSequenceMetadata checks the envelope rather than claiming deep validation.
 * @evidence contracts/common.md#clear-and-simple-design The shape keeps compiled shot data and order together for the canonical sequence planner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The ready marker is not treated as evidence of GPU appearance or geometric health.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies validated envelope fields, seconds, compiled inputs and the ready-marker limitation.
 * @evidence contracts/performance.md#efficient-algorithms The erased shape performs no work; the reader copies metadata and maps shot ids only when absent.
 * @evidence contracts/performance.md#reuse-equivalent-work The capture session reads one metadata snapshot and reuses it for planning and the artifact.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the copied sequence, shot array and ids; the type acquires no page or file handle.
 * @author Samchon
 */
export interface IAutoMoviePageSequenceMetadata {
  /** Readiness marker asserted only after all capture hooks are installed. */
  ready: true;

  /** Complete sequence running time in seconds. */
  duration: number;

  /** Compiled sequence whose global timeline drives capture. */
  sequence: IAutoMovieSequence;

  /** Compiled shots addressable by sequence and isolated-shot capture. */
  shots: IAutoMovieShot[];

  /** Stable shot order exposed for the resulting artifact. */
  shotIds: string[];
}
