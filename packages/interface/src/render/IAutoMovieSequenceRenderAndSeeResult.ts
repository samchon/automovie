import type { IAutoMovieRenderSpec } from "../cinematics/IAutoMovieRenderSpec.js";
import type { IAutoMovieSequenceRenderResult } from "./IAutoMovieSequenceRenderResult.js";

/** JSON-friendly sequence render artifact. */
export interface IAutoMovieSequenceRenderAndSeeResult extends IAutoMovieSequenceRenderResult {
  /** Render spec snapshot used for the sequence render. */
  spec: IAutoMovieRenderSpec;

  /** Sequence identity and authored fps snapshot. */
  sequence: {
    /** Rendered sequence identity. */
    id: string;
    /** Authored editorial frames per second, independent of the render override. */
    fps: number;
  };
}
