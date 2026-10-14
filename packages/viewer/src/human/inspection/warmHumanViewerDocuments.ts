import type { IWarmHumanViewerDocumentsProps } from "./IWarmHumanViewerDocumentsProps.js";
import { describeHumanViewerFailure } from "./describeHumanViewerFailure.js";

/**
 * Warm missing published thumbnails through the host's lowest queue lane. The host owns disk keys, GPU capture and queue admission. Each document is submitted separately so interactive work can run before the next warm item. A newer source or warm generation withdraws this pass before its next item.
 *
 * @evidence contracts/common.md#principled-implementation Filters matching current thumbnails and submits each missing document through the supplied lowest lane, recording actual capture refusals and withdrawing an obsolete pass before another item.
 * @evidence contracts/common.md#clear-and-simple-design The pass owns iteration and health progress while cache identity, GPU capture/storage and lane scheduling retain their host owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A failed capture increments skipped rather than successful done, and a replacement pass's progress is not overwritten after an awaited older capture.
 * @evidence contracts/common.md#meaningful-documentation Documentation identifies per-document scheduling, generation withdrawal, observable failure accounting and host ownership.
 * @evidence contracts/performance.md#efficient-algorithms One D-document filter precedes sequential missing captures; retained pending entries and failure records are O(D), and queue/render/write costs dominate actual warm work.
 * @evidence contracts/performance.md#reuse-equivalent-work Only the host's matching current thumbnail test skips capture; equal document ids without matching query/source authority do not establish completed work.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One submitted capture is awaited to settlement before the next item, pass arrays/failures are bounded by supplied document count and persistent lastFailure is one record.
 */
export async function warmHumanViewerDocuments(
  props: IWarmHumanViewerDocumentsProps,
): Promise<void> {
  const pending: IWarmHumanViewerDocumentsProps["documents"][number][] = props.documents.filter((entry: IWarmHumanViewerDocumentsProps["documents"][number]): boolean => !props.cached(entry.id));
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
