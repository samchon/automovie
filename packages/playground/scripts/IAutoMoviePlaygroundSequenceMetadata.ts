import type { IAutoMovieSequence, IAutoMovieShot } from "@automovie/interface";

/**
 * JSON-transferred capture-page marker, duration seconds, sequence, shots and shot order consumed by sequence capture. The reader checks ready, numeric duration, sequence id and a shots array; it does not deeply validate every shot here, and the ready marker alone does not prove healthy visible geometry or GPU provenance.
 *
 * @evidence contracts/common.md#principled-implementation The existing film page supplies ready, second-valued duration and canonical sequence/shot records through its metadata hook; the capture reader admits the outer fields before canonical planning consumes them.
 * @evidence contracts/common.md#clear-and-simple-design One transferred record supplies timeline and shot identity to the existing sequence capture without another page protocol or renderer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The reader's outer checks are not deep shot validation, and a ready marker is not evidence of healthy pixels or renderer provenance.
 * @evidence contracts/common.md#meaningful-documentation Identifies the JSON transfer, ready marker, duration units, sequence/shot population, stable order and limited runtime admission.
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
