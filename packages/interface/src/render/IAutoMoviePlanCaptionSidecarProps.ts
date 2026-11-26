import type { IAutoMovieSequence } from "../cinematics/IAutoMovieSequence.js";
import type { IAutoMovieShot } from "../cinematics/IAutoMovieShot.js";
import type { IAutoMovieScript } from "../harness/IAutoMovieScript.js";

/**
 * Screenplay caption source and output clock for one sequence.
 * `AutoMovieRenderCaption.planSidecar` resolves the sequence timeline and groups consecutive
 * output frames by live beat; null captions/scene slugs remain absent content
 * rather than synthesized text.
 */
export interface IAutoMoviePlanCaptionSidecarProps {
  /** The script whose screenplay tree carries captions and scene slugs. */
  script: IAutoMovieScript;

  /** The cut being rendered. */
  sequence: IAutoMovieSequence;

  /** The shots the cut references, each id at most once. */
  shots: IAutoMovieShot[];

  /**
   * Output frames per second: the render clock, which may differ from
   * `sequence.fps`.
   */
  fps: number;
}
