import { IAutoMovieProductionMediaProbe } from "@automovie/interface";

/**
 * Names the service's validated raw-byte candidate, canonical adapter identity, admitted video probe and output digest carried through generic execution.
 *
 * @evidence contracts/common.md#principled-implementation Names the service's validated raw-byte candidate, canonical adapter identity, admitted video probe and output digest carried through generic execution.
 * @evidence contracts/common.md#clear-and-simple-design The named internal payload connects service media validation to generic execution and candidate publication without adding a root-level provider API.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This structural shape introduces no runtime branch, provider substitution or fixture-specific behavior; runtime facts are admitted by its stated producer/consumer boundaries.
 * @evidence contracts/common.md#meaningful-documentation Bytes/probe metadata remain request-owned through publication; durable records retain addresses rather than this entire object.
 * @evidence contracts/performance.md#efficient-algorithms This structural type erases at runtime; the provider-output service validates these facts before the executor accepts its generic value; this type adds no new public payload API.
 * @evidence contracts/performance.md#reuse-equivalent-work This erased shape shares the same admitted facts across its stated consumers; it creates no result cache or runtime equivalence/invalidation shortcut.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Bytes/probe metadata remain request-owned through publication; durable records retain addresses rather than this entire object.
 */
export interface IAutoMovieProductionRepaintCandidate {
  /** Owns the copied admitted raw provider bytes through synchronous candidate publication. */
  bytes: Uint8Array;

  /** Carries the canonical reviewed provider/model/version/execution runtime identity. */
  adapterIdentity: string;

  /** Carries the admitted video metadata probe; delivery validation is a separate service seam. */
  probe: Extract<IAutoMovieProductionMediaProbe, { kind: "video" }>;

  /** Binds the copied provider output bytes before raw retention and candidate publication. */
  outputDigest: string;
}
