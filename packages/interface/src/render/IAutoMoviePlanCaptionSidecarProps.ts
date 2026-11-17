import type { IAutoMovieScript } from "../harness/IAutoMovieScript.js";
import type { IAutoMovieSequence } from "../cinematics/IAutoMovieSequence.js";
import type { IAutoMovieShot } from "../cinematics/IAutoMovieShot.js";

/**
 * Screenplay caption source and output clock for one sequence. planCaptionSidecar resolves the sequence timeline and groups consecutive output frames by live beat; null captions/scene slugs remain absent content rather than synthesized text.
 *
 * @evidence contracts/development/design.md#principled-representation Screenplay caption source and output clock for one sequence. planCaptionSidecar resolves the sequence timeline and groups consecutive output frames by live beat; null captions/scene slugs remain absent content rather than synthesized text.
 * @evidence contracts/development/design.md#minimal-and-owned-surface planCaptionSidecar exchanges script, sequence, shots, fps; their canonical owner is this contract and their concrete meanings are documented on the members.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Screenplay caption source and output clock for one sequence. planCaptionSidecar resolves the sequence timeline and groups consecutive output frames by live beat; null captions/scene slugs remain absent content rather than synthesized text.
 * @evidence contracts/development/common.md#meaningful-documentation Screenplay caption source and output clock for one sequence. planCaptionSidecar resolves the sequence timeline and groups consecutive output frames by live beat; null captions/scene slugs remain absent content rather than synthesized text. The prose and members document how planCaptionSidecar interprets and admits these values.
 */
export interface IAutoMoviePlanCaptionSidecarProps {
  /** The script whose screenplay tree carries captions and scene slugs. */
  script: IAutoMovieScript;

  /** The cut being rendered. */
  sequence: IAutoMovieSequence;

  /** The shots the cut references, each id at most once. */
  shots: IAutoMovieShot[];

  /**
   * Output frames per second: the render clock, which may differ from `sequence.fps`.
   */
  fps: number;
}
