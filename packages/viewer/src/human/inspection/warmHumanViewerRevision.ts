import fs from "node:fs";

import type { IWarmHumanViewerRevisionProps } from "./IWarmHumanViewerRevisionProps.js";
import { openHumanViewerHref } from "./openHumanViewerHref.js";
import { parseHumanViewerAddress } from "./parseHumanViewerAddress.js";
import { publishedHumanViewerWarmDocuments } from "./publishedHumanViewerWarmDocuments.js";
import { warmHumanViewerDocuments } from "./warmHumanViewerDocuments.js";
import { writeHumanViewerThumbnail } from "./writeHumanViewerThumbnail.js";

/**
 * Build every published document that has no thumbnail on disk yet, at the
 * lowest priority, so the first person or script to ask for one finds it
 * built. Each document is its own queue entry: a request in a higher lane
 * starts as soon as the one running finishes. A new source revision ends the
 * pass; a checked source generation may start a subsequent warm pass.
 */
export async function warmHumanViewerRevision(
  props: IWarmHumanViewerRevisionProps,
): Promise<void> {
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
