import type { IAutoMovieRenderSpec } from "../cinematics/IAutoMovieRenderSpec.js";
import type { IAutoMovieSequence } from "../cinematics/IAutoMovieSequence.js";
import type { IAutoMovieShot } from "../cinematics/IAutoMovieShot.js";
import type { IAutoMovieSequenceRenderAdapters } from "./IAutoMovieSequenceRenderAdapters.js";

/** Host-supplied request for building a sequence manifest and rendering it. */
export interface IAutoMovieSequenceRenderAndSeeRequest {
  /** Sequence being rendered. */
  sequence: IAutoMovieSequence;

  /** Committed shots referenced by the sequence. */
  shots: IAutoMovieShot[];

  /** Render parameters whose target must equal `sequence.id`. */
  spec: IAutoMovieRenderSpec;

  /** Directory where captured frames are written. */
  frameDir: string;

  /** Requested encoded video path. */
  outputPath: string;

  /** Capture and encode adapters owned by the host. */
  adapters: IAutoMovieSequenceRenderAdapters;
}
