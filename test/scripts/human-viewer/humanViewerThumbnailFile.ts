/**
 * A thumbnail belongs to its complete render address and numerical document
 * key. Display-only lane selection is excluded; a stale document key names
 * a different file. This calculation reads no file and does not own caching.
 */
import { createHash } from "node:crypto";
import path from "node:path";

import type { IHumanViewerThumbnailInventory } from "./IHumanViewerThumbnailInventory";
import { parseHumanViewerAddress } from "./parseHumanViewerAddress";
import { humanViewerThumbnailDirectory } from "./planHumanViewerThumbnailPrune";
import { serializeHumanViewerAddress } from "./serializeHumanViewerAddress";

const hash = (bytes: string): string =>
  createHash("sha256").update(bytes).digest("hex");

/**
 * The disk file of a thumbnail inside one viewer's thumbnail `folder`: the
 * address and the numerical key of its
 * document name it, so an edit that changes the document's build makes a new
 * file and a stale picture is never served for it. Null for an address that
 * does not parse or names no document.
 *
 * @evidence contracts/common.md#principled-implementation The serialized render address and numerical document key distinguish pixels and their source authority while excluding scheduling lanes.
 * @evidence contracts/common.md#clear-and-simple-design One pure path calculation serves warming and HTTP cache lookup.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Keys derive from caller inputs and catalogue authority without document-specific constants.
 * @evidence contracts/common.md#meaningful-documentation States stale authority, parsing refusal and the absence of filesystem ownership.
 */
export function humanViewerThumbnailFile(
  search: string,
  folder: string,
  inventory: IHumanViewerThumbnailInventory,
): string | null {
  try {
    const fields = new URLSearchParams(search);
    fields.delete("lane");
    const address = parseHumanViewerAddress(fields.toString());
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
