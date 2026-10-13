import type { IWarmHumanViewerDocumentsProps } from "./IWarmHumanViewerDocumentsProps.js";
import { describeHumanViewerFailure } from "./describeHumanViewerFailure.js";

/**
 * Warm missing published thumbnails through the host's lowest queue lane.
 * The host owns disk keys, GPU capture and queue admission. Each document is
 * submitted separately so interactive work can run before the next warm item.
 * A newer source or warm generation withdraws this pass before its next item.
 */
export async function warmHumanViewerDocuments(
  props: IWarmHumanViewerDocumentsProps,
): Promise<void> {
  const pending = props.documents.filter((entry) => !props.cached(entry.id));
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
      await props.queue(entry.id, () => props.capture(entry.id));
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
