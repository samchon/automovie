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
