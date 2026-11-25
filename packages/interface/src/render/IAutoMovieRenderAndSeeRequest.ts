import type { IAutoMovieRenderSpec } from "../cinematics/IAutoMovieRenderSpec.js";
import type { IAutoMovieRenderAdapters } from "./IAutoMovieRenderAdapters.js";

/**
 * Host-supplied request for rendering a clip and returning inspectable
 * artifacts.
 */
export interface IAutoMovieRenderAndSeeRequest {
  /** Render spec for the target shot or sequence. */
  spec: IAutoMovieRenderSpec;

  /** Target duration in seconds. */
  durationSeconds: number;

  /** Directory where captured frames are written. */
  frameDir: string;

  /** Requested encoded video path. */
  outputPath: string;

  /** Capture and encode adapters owned by the host. */
  adapters: IAutoMovieRenderAdapters;
}
