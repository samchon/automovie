/**
 * One caption placement whose half-open film frame range also owns synthesized dialogue emission timing.
 *
 * @evidence contracts/common.md#principled-implementation The canonical caption identity, text and global frame interval bind synthesis and final-byte visemes to the same authored line; speaker identity joins through explicit production bindings.
 * @evidence contracts/common.md#clear-and-simple-design Carries only shared line content and placement, leaving generated audio, phonemes, visemes and actor joins in their own receipt and runtime records.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Omitted speaker remains unspecified and produces a not-run mouth join; cast order or similar actor names never substitute for the explicit binding.
 * @evidence contracts/common.md#meaningful-documentation Defines caption ownership, spoken text, authored language and speaker labels, and inclusive-start exclusive-end film frames.
 * @author Samchon
 */
export interface IAutoMovieProductionDialogueLine {
  /** Exact builder-owned caption id. */
  id: string;

  /** Spoken and captioned text. */
  text: string;

  /** BCP-47-ish authored language label. */
  language: string;

  /** Optional authored speaker identity. */
  speaker?: string;

  /** Film-global inclusive start frame. */
  startFrame: number;

  /** Film-global exclusive end frame. */
  endFrame: number;
}
