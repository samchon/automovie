/**
 * One caption placement projected into the sound plan's intended dialogue emission interval.
 *
 * @evidence contracts/common.md#principled-implementation deriveProductionSoundPlan copies canonical caption identity, text, language, speaker and frame interval into dialogue rows. Supplied PCM and receipt validation use that line identity; this projection neither synthesizes audio nor applies an actor mouth layer.
 * @evidence contracts/common.md#clear-and-simple-design Carries only shared line content and placement, leaving generated audio, phonemes, visemes and actor joins in their own receipt and runtime records.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Omitted speaker remains unspecified. The separately available join helper returns not-run for absent or ambiguous bindings, but currently has only test callers; ProductionDesign.speakerBindings supplies no wired mouth application.
 * @evidence contracts/common.md#meaningful-documentation Defines caption ownership, spoken text, authored language and speaker labels, and inclusive-start exclusive-end film frames.
 * @author Samchon
 */
export interface IAutoMovieProductionDialogueLine {
  /** Exact builder-owned caption id. */
  id: string;

  /** Spoken and captioned text. */
  text: string;

  /** Authored language tag retained from the caption. */
  language: string;

  /** Optional authored speaker identity. */
  speaker?: string;

  /** Film-global inclusive start frame. */
  startFrame: number;

  /** Film-global exclusive end frame. */
  endFrame: number;
}
