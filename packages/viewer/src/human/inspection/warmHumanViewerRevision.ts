import fs from "node:fs";

import type { IWarmHumanViewerRevisionProps } from "./IWarmHumanViewerRevisionProps.js";
import { openHumanViewerHref } from "./openHumanViewerHref.js";
import { parseHumanViewerAddress } from "./parseHumanViewerAddress.js";
import { publishedHumanViewerWarmDocuments } from "./publishedHumanViewerWarmDocuments.js";
import { warmHumanViewerDocuments } from "./warmHumanViewerDocuments.js";
import { writeHumanViewerThumbnail } from "./writeHumanViewerThumbnail.js";

/**
 * Build published non-Person face/body documents that have no thumbnail on disk yet, at the lowest priority. Person and hand-written file entries remain outside this automatic pass and may be requested explicitly. Each selected document is its own queue entry: a request in a higher lane starts as soon as the one running finishes. A new source revision ends the pass; a checked source generation may start a subsequent warm pass.
 *
 * @evidence contracts/common.md#principled-implementation Warms standard queries only while ready page and desired inventory both match the target pass revision, then stores captured bytes under that same current thumbnail authority.
 * @evidence contracts/common.md#clear-and-simple-design Query construction and source checks join existing published-document selection, warm iteration and atomic thumbnail storage.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An old retained page cannot write its PNG under a newer inventory key, and source changes during capture refuse before selecting a storage path.
 * @evidence contracts/common.md#meaningful-documentation Documentation explains lowest-priority per-document work and the required ready-plus-inventory authority around asynchronous capture.
 * @evidence contracts/performance.md#efficient-algorithms Published selection scans D documents and each missing standard query incurs capture/PNG/disk work; existing current thumbnails avoid those expensive effects.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuse requires the exact supported standard thumbnail path under current document/source identity; stale ready pages and newer inventory do not count as equivalent work.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The host owns queued GPU operations and output files, each warm capture/write is awaited and its temporary PNG survives only that operation; generation changes withdraw subsequent items.
 */
export async function warmHumanViewerRevision(
  props: IWarmHumanViewerRevisionProps,
): Promise<void> {
  const thumbnail: (id: string) => string = (id: string): string =>
    openHumanViewerHref(id).thumbnail.slice("/render?".length);
  await warmHumanViewerDocuments({
    revision: props.revision,
    documents: publishedHumanViewerWarmDocuments(props.inventory().documents),
    currentRevision: (): string =>
      props.inventory().revision === props.readyRevision()
        ? props.readyRevision()
        : "",
    cached: (id: string): boolean => {
      const file: string | null = props.thumbnailFile(thumbnail(id));
      return file === null || fs.existsSync(file);
    },
    capture: async (id: string): Promise<void> => {
      const search: string = thumbnail(id);
      const png: Buffer = await props.capture(parseHumanViewerAddress(search));
      if (
        props.readyRevision() !== props.revision ||
        props.inventory().revision !== props.revision
      )
        throw new Error("Source changed during thumbnail warm.");
      const file: string | null = props.thumbnailFile(search);
      if (file !== null) await writeHumanViewerThumbnail(file, png);
    },
    queue: (id: string, run: () => Promise<void>): Promise<void> =>
      props.queue.run("warm " + id, run, "bulk"),
    status: props.warming,
  });
}
