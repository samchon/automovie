import type { IHumanViewerPreviewProjection } from "./IHumanViewerPreviewProjection.js";

/**
 * One successful preview retained by its producing numerical worker until
 * the page has drawn it. The immutable catalogue key and frame token are
 * captured with the build, never read from a later page generation.
 *
 * @evidence contracts/common.md#principled-implementation The successful preview is retained with its producing request, immutable cache key and authorized frame token.
 * @evidence contracts/common.md#clear-and-simple-design One job binds output to the source authority captured when it was built.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Construction results are outside this preview queue and later page state cannot replace its original token.
 * @evidence contracts/common.md#meaningful-documentation Comments distinguish numerical cache identity, frame write authority and the original admitted preview value.
 *
 * @evidence requirements/operations-and-recovery/cache-integrity-and-dependency-loss.md#operations-cache-identity-integrity The successful preview is retained with its producing request, immutable cache key and authorized frame token.
 * @evidence specifications/execution-and-recovery/checkpoints-resume-cache-and-dependencies.md#execution-cache-identity-invalidation Construction results are outside this preview queue and later page state cannot replace its original token.
 *
 * @author Samchon
 */
export interface IHumanViewerPersistenceJob {
  /**
   * Worker request that produced this projection.
   *
   * @evidence requirements/operations-and-recovery/cache-integrity-and-dependency-loss.md#operations-cache-identity-integrity Keeps optional persistence bound to the numerical request that produced the preview.
   * @evidence specifications/execution-and-recovery/checkpoints-resume-cache-and-dependencies.md#execution-cache-identity-invalidation Keeps optional persistence bound to the numerical request that produced the preview.
   */
  id: number;

  /**
   * Document, source and AO cache identity.
   *
   * @evidence requirements/operations-and-recovery/cache-integrity-and-dependency-loss.md#operations-cache-identity-integrity Captures the original document, source and AO cache identity with the build.
   * @evidence specifications/execution-and-recovery/checkpoints-resume-cache-and-dependencies.md#execution-cache-identity-invalidation Captures the original document, source and AO cache identity with the build.
   */
  key: string;

  /**
   * Proven source generation permitted to write by the server.
   *
   * @evidence requirements/operations-and-recovery/cache-integrity-and-dependency-loss.md#operations-cache-identity-integrity Retains the producing frame's proven write authority instead of borrowing a later page token.
   * @evidence specifications/execution-and-recovery/checkpoints-resume-cache-and-dependencies.md#execution-cache-identity-invalidation Retains the producing frame's proven write authority instead of borrowing a later page token.
   */
  token: string;

  /**
   * Original admitted-preview result; face and person constructions never enter this queue.
   *
   * @evidence requirements/operations-and-recovery/cache-integrity-and-dependency-loss.md#operations-cache-identity-integrity Contains only the original admitted-preview projection; construction output cannot enter this persistence queue.
   * @evidence specifications/execution-and-recovery/checkpoints-resume-cache-and-dependencies.md#execution-cache-identity-invalidation Contains only the original admitted-preview projection; construction output cannot enter this persistence queue.
   */
  value: IHumanViewerPreviewProjection;
}
