/**
 * An explicit speaker-to-actor identity pair supplied to the viseme join.
 *
 * @evidence contracts/common.md#principled-implementation The join requires exactly one pair matching the line speaker and a nonblank actor id; this pair does not prove the actor exists in a compiled scene.
 * @evidence contracts/common.md#clear-and-simple-design Binding is separate from the dialogue line and receipt so identity resolution is visible rather than encoded in a speaker-name convention.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No first-match actor fallback resolves ambiguity; zero or multiple speaker matches return distinct not-run outcomes.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes authored speaker identity from the actor id a downstream consumer must resolve; the pure join performs no scene lookup.
 * @evidence contracts/performance.md#efficient-algorithms One pair has constant storage; join matching scans B supplied pairs in O(B) time and stores the matching subset temporarily.
 * @evidence contracts/performance.md#reuse-equivalent-work Matching pairs are used only for that line's join, with no retained speaker registry or cache that could conceal changed bindings.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the input binding collection; the completed timeline retains the selected actor string rather than the binding object or scene.
 * @author Samchon
 */
export interface IAutoMovieDialogueSpeakerBinding {
  /** Authored speaker identity carried by the dialogue line. */
  speaker: string;

  /** Resolved actor node that owns the mouth layer. */
  actor: string;
}
