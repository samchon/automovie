import type { IAutoMovieSequence, IAutoMovieShot } from "@automovie/interface";

/**
 * JSON-transferred capture-page marker, duration seconds, sequence, shots and shot order consumed by sequence capture. The reader checks ready, numeric duration, sequence id and a shots array; it does not deeply validate every shot here, and the ready marker alone does not prove healthy visible geometry or GPU provenance.
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
