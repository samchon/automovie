/**
 * An explicit speaker-to-actor identity pair supplied to the viseme join.
 *
 * @evidence contracts/development/design.md#principled-representation The join requires exactly one pair matching the line speaker and a nonblank actor id; this pair does not prove the actor exists in a compiled scene.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Binding is separate from the dialogue line and receipt so identity resolution is visible rather than encoded in a speaker-name convention.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No first-match actor fallback resolves ambiguity; zero or multiple speaker matches return distinct not-run outcomes.
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes authored speaker identity from the actor id a downstream consumer must resolve; the pure join performs no scene lookup.
 */
export interface IAutoMovieDialogueSpeakerBinding {
  /** Authored speaker identity carried by the dialogue line. */
  speaker: string;

  /** Resolved actor node that owns the mouth layer. */
  actor: string;
}
