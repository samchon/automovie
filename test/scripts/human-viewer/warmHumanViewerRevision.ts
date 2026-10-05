import fs from "node:fs";

import type { IWarmHumanViewerRevisionProps } from "./IWarmHumanViewerRevisionProps";
import { openHumanViewerHref } from "./openHumanViewerHref";
import { parseHumanViewerAddress } from "./parseHumanViewerAddress";
import { publishedHumanViewerWarmDocuments } from "./publishedHumanViewerWarmDocuments";
import { warmHumanViewerDocuments } from "./warmHumanViewerDocuments";
import { writeHumanViewerThumbnail } from "./writeHumanViewerThumbnail";

/**
 * Build every published document that has no thumbnail on disk yet, at the
 * lowest priority, so the first person or script to ask for one finds it
 * built. Each document is its own queue entry: a request in a higher lane
 * starts as soon as the one running finishes. A new source revision ends the
 * pass, which the page reload restarts.
 *
 * @evidence contracts/common.md#principled-implementation The thumbnail key is the document's own render query, so warming and serving share one cache.
 * @evidence contracts/common.md#clear-and-simple-design One function binds the server's disk, capture and queue to the warm pass.
 * @evidence contracts/common.md#meaningful-documentation States priority, yielding and withdrawal.
 */
export async function warmHumanViewerRevision(props: IWarmHumanViewerRevisionProps): Promise<void> {
  const thumbnail = (id: string): string =>
    openHumanViewerHref(id).thumbnail.slice("/render?".length);
  await warmHumanViewerDocuments({
    revision: props.revision,
    documents: publishedHumanViewerWarmDocuments(props.inventory().documents),
    currentRevision: props.readyRevision,
    cached: (id) => {
      const file = props.thumbnailFile(thumbnail(id));
      return file === null || fs.existsSync(file);
    },
    capture: async (id) => {
      const search = thumbnail(id);
      const png = await props.capture(parseHumanViewerAddress(search));
      const file = props.thumbnailFile(search);
      if (file !== null) await writeHumanViewerThumbnail(file, png);
    },
    queue: (id, run) => props.queue.run("warm " + id, run, "bulk"),
    status: props.warming,
  });
}
