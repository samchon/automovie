import { AutoMovieRepaintRawOutputDisposition } from "./AutoMovieRepaintRawOutputDisposition";

/**
 * Attempt-owned identity of retained provider bytes. Planning copies bytes and derives their digest/address under a positive byte ceiling; project publication enforces immutable resident revisions. This mutable record declares no media validity or active selection.
 *
 * @evidence contracts/common.md#principled-implementation Versioned production/shot/request/attempt identity binds a canonical raw-byte address, SHA-256 digest and exact byte count to its declared retention ceiling and terminal disposition.
 * @evidence contracts/common.md#clear-and-simple-design The receipt separates retained byte identity from provider execution facts, media probing and final candidate selection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Provider mediaType is descriptive and successful retention supplies no playable-output or reviewed-delivery proof; runtime owners must admit current receipt/bytes.
 * @evidence contracts/common.md#meaningful-documentation Members state tracked-relative address, byte units, positive ceiling, provider declaration and exact UTC retention instant; prose gives runtime immutability ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The schema executes no byte hash, path derivation or transaction algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Receipt identity implements no provider/result cache or byte-currentness coordinator.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased interface allocates no receipt graph or raw-byte storage; planning/project/caller owners control actual retention.
 * @author Samchon
 */
export interface IAutoMovieRepaintRawOutputReceipt {
  /** Receipt schema version. */
  version: 1;

  /** Production namespace that owns the attempt. */
  productionId: string;

  /** Shot the attempt repainted. */
  shot: string;

  /** Request the attempt belongs to. */
  requestId: string;

  /** Attempt whose provider output these bytes are. */
  attemptId: string;

  /** Tracked project-relative path of the retained raw bytes. */
  path: string;

  /** Content digest of the retained raw bytes. */
  digest: string;

  /** Exact retained byte length. */
  bytes: number;

  /** Retention ceiling the raw output was admitted under. */
  maximumBytes: number;

  /** Media type the provider declared for the raw output. */
  mediaType: string;

  /** Terminal attempt disposition the raw output belongs to. */
  disposition: AutoMovieRepaintRawOutputDisposition;

  /** ISO-8601 UTC instant the raw output was retained. */
  retainedAt: string;
}
