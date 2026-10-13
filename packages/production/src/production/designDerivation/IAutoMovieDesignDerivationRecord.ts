import type { IAutoMovieDesignDerivationBasis } from "./IAutoMovieDesignDerivationBasis";

/**
 * One output's declared target/path, basis identity and canonical-byte digest.
 *
 * @evidence contracts/common.md#principled-implementation Candidate assembly matches exact target/path to one basis and records separate canonical basis and output-byte SHA-256 digests.
 * @evidence contracts/common.md#clear-and-simple-design Each output record carries its own producer metadata so inspection can name stale basis and stale bytes independently.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Recorded digests alone do not prove current bytes, authenticated provenance or actual evaluator source execution.
 * @evidence contracts/common.md#meaningful-documentation Defines target, record path, stored basis, canonical basis digest and canonical output-byte digest consumed by lineage inspection.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The record erases; basis canonicalization, output copying/hashing and inspection reads remain their owners' costs.
 * @evidence contracts/performance.md#reuse-equivalent-work Inspection requires both current basis identity and exact current output digest; matching target name alone cannot reuse a record as current.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Manifest/candidate callers retain one basis and scalar digests per output, without a numeric cap or native resource acquired by this record.
 *
 * @author Samchon
 */
export interface IAutoMovieDesignDerivationRecord {
  /** Stable logical target identity. */
  target: string;

  /** Canonical path of the derived output. */
  recordPath: string;

  /** Complete producer basis recorded with the output. */
  basis: IAutoMovieDesignDerivationBasis;

  /** Canonical digest of `basis`. */
  basisDigest: string;

  /** SHA-256 digest of the canonical output bytes. */
  outputDigest: string;
}
