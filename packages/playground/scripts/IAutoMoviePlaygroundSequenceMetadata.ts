import type { IAutoMovieSequence, IAutoMovieShot } from "@automovie/interface";

/**
 * JSON-transferred capture-page marker, duration seconds, sequence, shots and shot order consumed by sequence capture. The reader checks ready, numeric duration, sequence id and a shots array; it does not deeply validate every shot here, and the ready marker alone does not prove healthy visible geometry or GPU provenance.
 *
 * @evidence contracts/common.md#principled-implementation Named dimensions, paths and canonical render/sequence references expose the existing typed capture boundary without a second protocol.
 * @evidence contracts/common.md#clear-and-simple-design The original CLI and capture function consume this record; rendering, page capture and output admission remain with their existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An erased type does not validate physical anatomy, resource existence, pixels or successful encoding; the comment separates requested values from observations.
 * @evidence contracts/common.md#meaningful-documentation The comment names the actual consumer, units, ownership, cost and interpretation limits.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Erased shape declarations perform no capture, numerical sampling or pixel iteration.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Erased shape declarations own no cache or repeated runtime work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Erased shape declarations acquire no native handle; runtime owners release browser/page/encoder resources.
 *
 * @author Samchon
 */
export interface IAutoMoviePlaygroundSequenceMetadata {
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
