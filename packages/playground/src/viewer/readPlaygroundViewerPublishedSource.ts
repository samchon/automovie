import type { IPlaygroundViewerPublicationReader } from "./IPlaygroundViewerPublicationReader.js";

/**
 * Read a source receipt outside the producer's publication lock. A retained lock returns an admission-error shell without mutating the held receipt. After release, a receipt that observed the lock is reread, and a lock beginning during that refresh also refuses the new receipt. The host retains its current completed page separately; these observations do not form an atomic filesystem snapshot.
 *
 * @evidence contracts/common.md#principled-implementation Before/after lock observations exclude supported in-progress publication, and a non-missing lock witness triggers source-owner refresh so intermediate membership does not silently become current after release.
 * @evidence contracts/common.md#clear-and-simple-design Three injected effects preserve receipt/IO ownership while the guard adds only admission-error copies; displayed-page replacement remains host-owned.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Lock errors neither mutate held bytes nor claim renderer rollback, and effect failures propagate instead of fabricating an unlocked source. Filesystem publication is not made atomic by two observations.
 * @evidence contracts/common.md#meaningful-documentation The comment explains retained lock, post-release reread, lock-during-refresh refusal and non-atomic observation limits.
 * @evidence contracts/performance.md#efficient-algorithms Guard bookkeeping is constant work; a refused shell copies the receipt's top-level members and refresh retains the source owner's full membership/byte/hash cost. Inputs maps remain borrowed rather than deep-copied.
 * @evidence contracts/performance.md#reuse-equivalent-work The unlocked completed receipt retains owner identity when no lock witness requires refresh; a witnessed lock invalidates that reuse and delegates current bytes to the source owner.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The call retains no receipt cache or handle, returning borrowed current state or a shallow error shell. Source receipt retention and producer lock release remain their owners' responsibilities.
 *
 * @author Samchon
 */
export function readPlaygroundViewerPublishedSource<
  T extends {
    /**
     * Declared disk-input keys mapped to their retained byte digest or the literal missing sentinel.
     */
    inputs: Record<string, string>;

    /**
     * A source-owner failure that refuses candidate admission; omission means no recorded read failure.
     */
    error?: string;
  },
>(props: IPlaygroundViewerPublicationReader<T>): T {
  const current: T = props.current();
  if (props.locked())
    return {
      ...current,
      error:
        "Human runtime publication is pending or requires recovery; the last displayed model remains held.",
    };
  if (current.inputs[props.lockInput] !== "missing") props.refresh();
  if (props.locked())
    return {
      ...props.current(),
      error:
        "Human runtime publication is pending or requires recovery; the last displayed model remains held.",
    };
  return props.current();
}
