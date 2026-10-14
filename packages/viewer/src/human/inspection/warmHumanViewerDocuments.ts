import type { IWarmHumanViewerDocumentsProps } from "./IWarmHumanViewerDocumentsProps.js";
import { describeHumanViewerFailure } from "./describeHumanViewerFailure.js";

/**
 * Warm missing published thumbnails through the host's lowest queue lane. The host owns disk keys, GPU capture and queue admission. Each document is submitted separately so interactive work can run before the next warm item. A differing current source or progress revision withdraws this pass before its next item; revision equality does not distinguish separate same-revision passes or an A-to-B-to-A return.
 *
 * @evidence contracts/common.md#principled-implementation Filters matching current thumbnails and submits each missing document through the supplied lowest lane, recording capture refusals and withdrawing before another item when current source or progress revision differs.
 * @evidence contracts/common.md#clear-and-simple-design The pass owns iteration and health progress while cache identity, GPU capture/storage and lane scheduling retain their host owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A failed capture increments skipped rather than successful done. After awaiting capture only the progress revision is checked; a differing revision blocks updates, but an older pass with the same revision can still update replacement counters because no per-pass identity is tracked.
 * @evidence contracts/common.md#meaningful-documentation Documentation identifies per-document scheduling, revision-based withdrawal, same-revision progress interference, failure accounting and host ownership.
 * @evidence contracts/performance.md#efficient-algorithms One D-document filter precedes sequential missing captures; retained pending entries and failure records are O(D), and queue/render/write costs dominate actual warm work.
 * @evidence contracts/performance.md#reuse-equivalent-work Only the host's matching current thumbnail test skips capture; equal document ids without matching query/source authority do not establish completed work.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One submitted capture is awaited to settlement before the next item, pass arrays/failures are bounded by supplied document count and persistent lastFailure is one record.
 */
export async function warmHumanViewerDocuments(
  props: IWarmHumanViewerDocumentsProps,
): Promise<void> {
  const pending: IWarmHumanViewerDocumentsProps["documents"][number][] =
    props.documents.filter(
      (entry: IWarmHumanViewerDocumentsProps["documents"][number]): boolean =>
        !props.cached(entry.id),
    );
  Object.assign(props.status, {
    revision: props.revision,
    total: props.documents.length,
    done: props.documents.length - pending.length,
    skipped: 0,
    failures: [],
    current: null,
  });
  for (const entry of pending) {
    if (
      props.currentRevision() !== props.revision ||
      props.status.revision !== props.revision
    )
      return;
    props.status.current = entry.id;
    let failed: string | null = null;
    try {
      await props.queue(entry.id, (): Promise<void> => props.capture(entry.id));
    } catch (error) {
      failed = describeHumanViewerFailure(
        error instanceof Error ? error.message : String(error),
      );
    }
    if (props.status.revision !== props.revision) return;
    if (failed !== null) {
      ++props.status.skipped;
      props.status.failures.push({ id: entry.id, reason: failed });
      // Kept across passes: a new pass resets the counters, not this.
      props.status.lastFailure = {
        id: entry.id,
        reason: failed,
        at: new Date().toISOString(),
        revision: props.revision,
      };
    } else ++props.status.done;
  }
  props.status.current = null;
}
