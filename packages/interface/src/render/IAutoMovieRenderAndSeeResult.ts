import type { IAutoMovieRenderSpec } from "../cinematics/IAutoMovieRenderSpec.js";
import type { IAutoMovieRenderResult } from "./IAutoMovieRenderResult.js";

/** JSON-friendly render artifact returned to an agent or host. */
export interface IAutoMovieRenderAndSeeResult extends IAutoMovieRenderResult {
  /** Render spec snapshot used for the capture. */
  spec: IAutoMovieRenderSpec;

  /** Target duration in seconds. */
  durationSeconds: number;
}
