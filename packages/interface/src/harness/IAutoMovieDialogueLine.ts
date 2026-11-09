/**
 * One screenplay line inside a beat: speaker, verbatim text and an optional beat-local anchor. This harness record does not drive audio; production dialogue, sound and lip-sync records own those capabilities.
 *
 * `renderScreenplay` is its reader in this repository: it prints the speaker
 * in capitals and, when anchored, `[t=<anchor>s]` before the text. Viseme
 * joins read the production dialogue records instead, and no cut-timing pass
 * reads this type. Project validation requires a non-empty speaker and text,
 * and both it and `validateScriptTree` refuse an anchor that is negative or
 * not finite.
 *
 * @evidence contracts/development/design.md#principled-representation A speaker, verbatim text and an optional beat-local time are the facts a screenplay line prints, and `renderScreenplay` formats them in the conventional centred-name layout without interpreting the text.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The line holds no audio, viseme or duration field, because those belong to the production dialogue records that sound and lip-sync read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The speaker is not resolved against the cast, a gap stated on the field, and `null` is the only spelling of a floating line, so no sentinel time stands in for it.
 * @evidence contracts/development/common.md#meaningful-documentation States the one reader and its output form, which records other passes read instead, and the validators' rules; members give the speaker scope, verbatim text, and the anchor's unit, range and null meaning.
 */
export interface IAutoMovieDialogueLine {
  /**
   * Cast character or scene node who speaks; non-empty, and not checked
   * against the cast.
   */
  speaker: string;

  /** The spoken line, verbatim and non-empty. */
  text: string;

  /**
   * Seconds into the beat this line lands, finite and `>= 0`, in the spirit of
   * {@link IAutoMovieTimingAnchor}, or `null` when the line floats freely inside
   * the beat.
   */
  anchor: number | null;
}
