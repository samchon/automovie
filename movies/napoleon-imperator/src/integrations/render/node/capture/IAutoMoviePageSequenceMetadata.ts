import type { IAutoMovieSequence, IAutoMovieShot } from "@automovie/interface";

/**
 * JSON-transferred capture-page marker, duration seconds, sequence, shots and shot order consumed by sequence capture. The reader checks ready, numeric duration, sequence id and a shots array; it does not deeply validate every shot here, and the ready marker alone does not prove healthy visible geometry or GPU provenance.
 *
 *
 * @evidence contracts/development/design.md#principled-representation A JSON copy transfers readiness, duration, sequence and shots from the page; readSequenceMetadata checks the envelope rather than claiming deep validation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The shape keeps compiled shot data and order together for the canonical sequence planner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The ready marker is not treated as evidence of GPU appearance or geometric health.
 * @evidence contracts/development/common.md#meaningful-documentation The comment identifies validated envelope fields, seconds, compiled inputs and the ready-marker limitation.
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
