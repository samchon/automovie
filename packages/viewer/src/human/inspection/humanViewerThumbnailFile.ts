/**
 * A thumbnail belongs to its complete render address and numerical document
 * key. Display-only lane selection is excluded; a stale document key names
 * a different file. This calculation reads no file and does not own caching.
 */
import { createHash } from "node:crypto";
import path from "node:path";

import type { IHumanViewerThumbnailInventory } from "./IHumanViewerThumbnailInventory.js";
import { parseHumanViewerAddress } from "./parseHumanViewerAddress.js";
import { humanViewerThumbnailDirectory } from "./humanViewerThumbnailDirectory.js";
import { serializeHumanViewerAddress } from "./serializeHumanViewerAddress.js";

const hash = (bytes: string): string =>
  createHash("sha256").update(bytes).digest("hex");

/**
 * The disk file of a thumbnail inside one viewer's thumbnail `folder`: the
 * address and the numerical key of its
 * document name it, so an edit that changes the document's build makes a new
 * file and a stale picture is never served for it. Null for an address that
 * does not parse or names no document.
 */
export function humanViewerThumbnailFile(
  search: string,
  folder: string,
  inventory: IHumanViewerThumbnailInventory,
): string | null {
  try {
    const fields = new URLSearchParams(search);
    fields.delete("lane");
    const address = parseHumanViewerAddress(fields.toString(), inventory.documents[0]?.id);
    const document = inventory.documents.find(
      (entry) => entry.id === address.doc,
    );
    // A frame carrying a reference photograph never reaches the disk cache.
    if (document === undefined || address.ref !== null) return null;
    return path.join(
      folder,
      humanViewerThumbnailDirectory(inventory.revision),
      hash(serializeHumanViewerAddress(address) + document.key) + ".png",
    );
  } catch {
    return null;
  }
}
