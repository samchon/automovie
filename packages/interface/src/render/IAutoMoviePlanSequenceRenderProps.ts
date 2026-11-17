import type { IAutoMovieRenderSpec } from "../cinematics/IAutoMovieRenderSpec.js";
import type { IAutoMovieSequence } from "../cinematics/IAutoMovieSequence.js";
import type { IAutoMovieShot } from "../cinematics/IAutoMovieShot.js";

/**
 * Committed editorial sequence plus output rendering clock and paths. planSequenceRender requires spec.target to match sequence.id and refuses a zero-frame schedule. The engine owns trim/transition admission; omitted paths derive from the sanitized sequence id as frames/<stem> and <stem>.mp4.
 *
 * @evidence contracts/development/design.md#principled-representation The engine owns trim/transition admission; omitted paths derive from the sanitized sequence id as frames/<stem> and <stem>.mp4.
 * @evidence contracts/development/design.md#minimal-and-owned-surface planSequenceRender exchanges sequence, shots, spec, frameDir, outputPath; their canonical owner is this contract and their concrete meanings are documented on the members.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The engine owns trim/transition admission; omitted paths derive from the sanitized sequence id as frames/<stem> and <stem>.mp4.
 * @evidence contracts/development/common.md#meaningful-documentation Committed editorial sequence plus output rendering clock and paths. planSequenceRender requires spec.target to match sequence.id and refuses a zero-frame schedule. The prose and members document how planSequenceRender interprets and admits these values.
 */
export interface IAutoMoviePlanSequenceRenderProps {
  /** Sequence being rendered. */
  sequence: IAutoMovieSequence;

  /** Committed shots referenced by the sequence. */
  shots: IAutoMovieShot[];

  /** Render parameters whose `target` must equal `sequence.id`. */
  spec: IAutoMovieRenderSpec;

  /** Frame directory override; omitted uses frames/<sanitized sequence id>. No directory is created by planning. */
  frameDir?: string;

  /** Encoded output path override; omitted uses <sanitized sequence id>.mp4. Planning writes no file. */
  outputPath?: string;
}
