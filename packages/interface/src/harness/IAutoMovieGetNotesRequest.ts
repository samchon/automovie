/**
 * Asks for the open review notes, the correction backlog a revise pass must
 * address, so the next blocking or performance round reads what the reviewer
 * asked to fix instead of rebuilding blind.
 *
 * The engine's `readSlateContext` answers it from the slate's `notes` list:
 * every open note, or only the notes filed on `beat` when one is given, and an
 * empty list rather than `null` when none match. `reviewShot` guarantees that a
 * revise verdict carries at least one note filed on the judged beat, but moving
 * those notes onto the slate is the host's step; nothing in the engine writes
 * them there.
 *
 * @evidence contracts/common.md#principled-implementation An optional beat filter over the stored list, by exact id equality, which is the key `reviewShot` requires every note to carry.
 * @evidence contracts/common.md#clear-and-simple-design One optional field scopes the read; the note shape is owned by `IAutoMovieReviewNote`, and the unfiltered list is the slate's own array.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An unmatched beat answers an empty list instead of falling back to every note, and the documentation states that no engine path fills the slate's notes.
 * @evidence contracts/common.md#meaningful-documentation States the purpose, the resolver, the filtered, unfiltered and empty answers, what `reviewShot` guarantees about notes, and who stores them; the members give the discriminator and what omitting `beat` means.
 * @author Samchon
 */
export interface IAutoMovieGetNotesRequest {
  /** Selects the query that reads outstanding review findings. */
  type: "getNotes";

  /** Beat id whose notes are read; omitted, every open note is returned. */
  beat?: string;
}
