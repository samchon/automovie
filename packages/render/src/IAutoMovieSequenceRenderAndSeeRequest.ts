import {
  IAutoMovieRenderSpec,
  IAutoMovieSequence,
  IAutoMovieShot,
} from "@automovie/interface";

import type { IAutoMovieSequenceRenderAdapters } from "./IAutoMovieSequenceRenderAdapters.js";

/**
 * Host-supplied request for building a sequence manifest and rendering it.
 *
 * @evidence contracts/development/design.md#principled-representation A committed sequence, its shots and a render spec provide the editorial and output inputs, while paths and adapters identify host execution effects.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The agent-facing request groups planning inputs and capture ownership without embedding a renderer in the cut representation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The target-equality contract prevents rendering an unrelated sequence under a different target identity.
 * @evidence contracts/development/common.md#meaningful-documentation Properties name committed shot references, target equality, frame and video destinations and host-owned adapters.
 */
export interface IAutoMovieSequenceRenderAndSeeRequest {
  /**
   * Sequence being rendered.
   */
  sequence: IAutoMovieSequence;

  /**
   * Committed shots referenced by the sequence.
   */
  shots: IAutoMovieShot[];

  /**
   * Render parameters whose target must equal `sequence.id`.
   */
  spec: IAutoMovieRenderSpec;

  /**
   * Directory where captured frames are written.
   */
  frameDir: string;

  /**
   * Requested encoded video path.
   */
  outputPath: string;

  /**
   * Capture and encode adapters owned by the host.
   */
  adapters: IAutoMovieSequenceRenderAdapters;
}
