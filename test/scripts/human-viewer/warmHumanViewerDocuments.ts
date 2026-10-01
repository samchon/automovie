/**
 * Warm missing published thumbnails through the host's lowest queue lane.
 * The host owns disk keys, GPU capture and queue admission. Each document is
 * submitted separately so interactive work can run before the next warm item.
 * A newer source or warm generation withdraws this pass before its next item.
 *
 * @evidence contracts/common.md#principled-implementation Each missing document is a separate admitted queue task, and a superseded pass cannot update its successor's counters.
 * @evidence contracts/common.md#clear-and-simple-design The host supplies persistence and capture while this function owns only pass ordering and progress.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Applies the same cache and generation rules to every document with no fixture-specific warm path.
 * @evidence contracts/common.md#meaningful-documentation Defines queue ownership, yielding and withdrawal when either source or pass authority changes.
 */
export async function warmHumanViewerDocuments(props: {
  revision: string;
  documents: readonly { id: string }[];
  currentRevision: () => string;
  cached: (id: string) => boolean;
  capture: (id: string) => Promise<void>;
  queue: (id: string, capture: () => Promise<void>) => Promise<unknown>;
  status: {
    revision: string;
    total: number;
    done: number;
    skipped: number;
    current: string | null;
  };
}): Promise<void> {
  const pending = props.documents.filter((entry) => !props.cached(entry.id));
  Object.assign(props.status, {
    revision: props.revision,
    total: props.documents.length,
    done: props.documents.length - pending.length,
    skipped: 0,
    current: null,
  });
  for (const entry of pending) {
    if (props.currentRevision() !== props.revision ||
        props.status.revision !== props.revision) return;
    props.status.current = entry.id;
    let failed = false;
    try {
      await props.queue(entry.id, () => props.capture(entry.id));
    } catch {
      failed = true;
    }
    if (props.status.revision !== props.revision) return;
    if (failed) ++props.status.skipped;
    else ++props.status.done;
  }
  props.status.current = null;
}
