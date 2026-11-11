import { IAutoMovieRenderSpec } from "@automovie/interface";

import { IAutoMovieRenderAdapters } from "./IAutoMovieRenderAdapters.js";

/**
 * Host-supplied request for rendering a clip and returning inspectable artifacts.
 *
 * @evidence contracts/development/design.md#principled-representation The request couples one render spec and duration in seconds with explicit host paths and adapters, providing all inputs the clip orchestration needs.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A single request object groups clip rendering and artifact metadata inputs at the agent-facing boundary.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Host effects enter through the declared adapters rather than source-specific branches or process-global replacements.
 * @evidence contracts/development/common.md#meaningful-documentation Members identify seconds, requested video path, frame directory and host ownership of capture and encoding.
 */
export interface IAutoMovieRenderAndSeeRequest {
  /**
   * Render spec for the target shot or sequence.
   */
  spec: IAutoMovieRenderSpec;

  /**
   * Target duration in seconds.
   */
  durationSeconds: number;

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
  adapters: IAutoMovieRenderAdapters;
}
