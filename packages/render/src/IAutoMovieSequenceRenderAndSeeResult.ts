import { IAutoMovieRenderSpec } from "@automovie/interface";

import type { IAutoMovieSequenceRenderResult } from "./IAutoMovieSequenceRenderResult";

/**
 * JSON-friendly sequence render artifact.
 *
 * @evidence contracts/common.md#principled-implementation The sequence outcome adds a shallow render-spec snapshot and the authored sequence id and fps so output sampling remains distinguishable from editorial intent.
 * @evidence contracts/common.md#clear-and-simple-design The wrapper extends executed sequence metadata rather than redefining capture records or plan fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The sequence snapshot reports authored fps even when the output spec requests a different sampling rate.
 * @evidence contracts/common.md#meaningful-documentation Added member comments name the render spec snapshot and sequence identity with authored fps; inherited members define captured artifacts.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The sequence inspection envelope declares data and chooses no runtime algorithm; its producer documents construction cost.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The authored sequence identity snapshot describes an identity boundary and performs no request coordination or result caching.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The erased artifact type retains nothing itself; renderSequenceAndSee transfers render metadata and shared spec values to the result caller, without taking ownership of host-written files.
 */
export interface IAutoMovieSequenceRenderAndSeeResult extends IAutoMovieSequenceRenderResult {
  /**
   * Render spec snapshot used for the sequence render.
   */
  spec: IAutoMovieRenderSpec;

  /**
   * Sequence identity and authored fps snapshot.
   */
  sequence: { id: string; fps: number };
}
