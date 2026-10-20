import type { IAutoMovieCaptureRuntimeIdentity } from "@automovie/interface";

import type { IAutoMovieProductionEncoderIdentity } from "./IAutoMovieProductionEncoderIdentity";

/**
 * Capture and encoder identity shared by every chunk of one render job.
 *
 * Every chunk id digests the whole record, so a change to the viewer bytes,
 * the browser, the graphics backend, the dialogue runtime or the encoder gives
 * every chunk a new id. `planProductionRenderJob` refuses a `sourceDigest` or
 * non-null `dialogueRuntimeIdentity` that is not a SHA-256 content digest; the
 * caller supplies the rest.
 *
 * @evidence contracts/common.md#principled-implementation Content addressing needs every runtime input that can change captured or encoded bytes, so the record carries a digest of the declared viewer and package inputs, the dialogue runtime digest, the full capture identity and the encoder identity.
 * @evidence contracts/common.md#clear-and-simple-design Capture facts reuse the interface's `IAutoMovieCaptureRuntimeIdentity` and encoder facts live in `IAutoMovieProductionEncoderIdentity`, so this record only joins them with the two job-wide digests.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The protocol literal is the schema version and the only fixed value; null for the dialogue runtime is the documented silent-production state, not a fallback.
 * @evidence contracts/common.md#meaningful-documentation The doc says why every field reaches the chunk ids, which fields the planner validates, and each member states what it identifies and what null means.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Joining capture and encoder facts is a static record; its size, dominated by the capture package closure list, enters each chunk digest in `planProductionRenderJob`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A plain record coordinates no phases or requests; equivalence of renders is decided by the chunk ids that digest it.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The runtime identity describes a browser and encoder without holding a browser page, process or file; the plan's `runtimeIdentity` field keeps one instance shared by all chunk identities.
 */
export interface IAutoMovieProductionRenderRuntimeIdentity {
  /** Schema of this record; changes when its meaning changes. */
  protocolVersion: "automovie.production-render-runtime.v3";

  /** SHA-256 digest of the declared viewer, capture, asset and package bytes. */
  sourceDigest: string;

  /**
   * SHA-256 digest of the dialogue and viseme runtime installed for every
   * capture, or null when the production synthesizes no dialogue.
   */
  dialogueRuntimeIdentity: string | null;

  /** Browser, graphics and installed-package identity of the capture host. */
  capture: IAutoMovieCaptureRuntimeIdentity;

  /** Encoder package, closure and byte-affecting settings. */
  encoder: IAutoMovieProductionEncoderIdentity;
}
