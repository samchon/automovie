import type { IPlaygroundViewerPublicationReader } from "./IPlaygroundViewerPublicationReader.js";

/**
 * Admit a disk source only outside its producer's publication transaction.
 * A retained lock refuses new candidates without withdrawing the caller's
 * last displayed model. A cached receipt that observed the lock is reread
 * after release, so its intermediate file membership cannot become current.
 *
 * An unlocked read retains the original receipt unless refresh is needed. A
 * locked read returns a shallow copy with an admission error; it does not mutate
 * the held receipt. Effect failures propagate from their owners. This sequence
 * does not claim an atomic filesystem snapshot or renderer rollback.
 *
 * @evidence contracts/common.md#principled-implementation A producer's actual lock gates admission, and the first unlocked read refreshes any receipt captured during publication.
 * @evidence contracts/common.md#clear-and-simple-design One source-read boundary composes the held receipt, publication state and existing refresh operation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A lock cannot expire by age, and the reader never certifies intermediate membership as a completed publication.
 * @evidence contracts/common.md#meaningful-documentation Defines held-receipt identity, lock refusal, refresh order and propagated effect failures without claiming an atomic filesystem snapshot.
 * @evidence requirements/product/prototype-quality.md#product-authored-variation-determinism Refuses adoption of intermediate producer inputs and refreshes their recorded membership after publication before the application replays its authored choices.
 * @evidence specifications/authoring-and-authority/prototype-determinism-and-fidelity.md#spec-authoring-deterministic-input-identity Preserves the original disk receipt and admits a refreshed source-input identity only outside the declared publication transaction.
 */
export function readPlaygroundViewerPublishedSource<T extends {
  /**
   * Declared disk-input keys mapped to their retained byte digest or the literal missing sentinel.
   */
  inputs: Record<string, string>;

  /**
   * A source-owner failure that refuses candidate admission; omission means no recorded read failure.
   */
  error?: string
}>(props: IPlaygroundViewerPublicationReader<T>): T {
  const current = props.current();
  if (props.locked())
    return { ...current, error: "Human runtime publication is pending or requires recovery; the last displayed model remains held." };
  if (current.inputs[props.lockInput] !== "missing") props.refresh();
  if (props.locked())
    return { ...props.current(), error: "Human runtime publication is pending or requires recovery; the last displayed model remains held." };
  return props.current();
}
