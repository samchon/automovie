import { IAutoMovieRenderSpec } from "@automovie/interface";

import type { IAutoMovieSequenceRenderResult } from "./IAutoMovieSequenceRenderResult.js";

/**
 * JSON-friendly sequence render artifact.
 *
 * @evidence contracts/development/design.md#principled-representation The sequence outcome adds a shallow render-spec snapshot and the authored sequence id and fps so output sampling remains distinguishable from editorial intent.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The wrapper extends executed sequence metadata rather than redefining capture records or plan fields.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The sequence snapshot reports authored fps even when the output spec requests a different sampling rate.
 * @evidence contracts/development/common.md#meaningful-documentation Added member comments name the render spec snapshot and sequence identity with authored fps; inherited members define captured artifacts.
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
