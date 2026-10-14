/**
 * A thumbnail belongs to its complete render address and numerical document key. Display-only lane selection is excluded; a stale document key names a different file. This calculation reads no file and does not own caching.
 */
import { createHash } from "node:crypto";
import path from "node:path";

import type { IHumanViewerThumbnailInventory } from "./IHumanViewerThumbnailInventory.js";
import { parseHumanViewerAddress } from "./parseHumanViewerAddress.js";
import { humanViewerThumbnailDirectory } from "./humanViewerThumbnailDirectory.js";
import { serializeHumanViewerAddress } from "./serializeHumanViewerAddress.js";

const hash: (bytes: string) => string = (bytes: string): string =>
  createHash("sha256").update(bytes).digest("hex");

/**
 * The disk file of a thumbnail inside one viewer's thumbnail `folder`: the address and the numerical key of its document name it, so changed document authority ordinarily selects another filename. The source directory uses a sixteen-hex revision prefix and filename hashing retains conventional digest collision assumptions; neither name certifies full byte identity. Null for an address that does not parse or names no document.
 *
 * @evidence contracts/common.md#principled-implementation Canonical parsed render address and the selected numerical document key form a digest filename inside the current source revision directory.
 * @evidence contracts/common.md#clear-and-simple-design Address parsing, document selection and canonical serialization feed one filename projection; this helper performs no thumbnail IO or pruning.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing documents, malformed addresses and photograph-bearing captures return null, and scheduling lane text is excluded rather than creating an alternate render cache identity.
 * @evidence contracts/common.md#meaningful-documentation Documentation defines address/document key authority, current source directory and refusal of absent selection while the inline rule excludes reference photos.
 * @evidence contracts/performance.md#efficient-algorithms Address parsing/serialization and hashing scale with address text, while selected document lookup is linear in inventory size and reads no image bytes.
 * @evidence contracts/performance.md#reuse-equivalent-work Equal canonical render addresses and numerical keys share a name under the same revision prefix; changing numerical authority names another file and lane alone does not alter rendered identity.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Search fields and selected address are local and only a filename survives; image storage lifetime and stale-file removal belong to the thumbnail store.
 */
export function humanViewerThumbnailFile(
  search: string,
  folder: string,
  inventory: IHumanViewerThumbnailInventory,
): string | null {
  try {
    const fields: URLSearchParams = new URLSearchParams(search);
    fields.delete("lane");
    const address: ReturnType<typeof parseHumanViewerAddress> = parseHumanViewerAddress(fields.toString(), inventory.documents[0]?.id);
    const document: IHumanViewerThumbnailInventory["documents"][number] | undefined = inventory.documents.find(
      (entry: IHumanViewerThumbnailInventory["documents"][number]): boolean => entry.id === address.doc,
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
