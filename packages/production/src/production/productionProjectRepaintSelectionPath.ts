import path from "node:path";
import { encodeAutoMoviePathSegment } from "./contentIdentity";
import { productionProjectUuid } from "./productionProjectUuid";
import { productionProjectTrimmedText } from "./productionProjectTrimmedText";

/**
 * Address one historical repaint selection within its shot's production-state namespace.
 *
 * @evidence contracts/common.md#principled-implementation Requires trimmed nonblank shot text and UUIDv4 selection spelling, encodes both segments and joins a portable renditions/selections/shot/selection.json path.
 * @evidence contracts/common.md#clear-and-simple-design Selection publication and verified lineage resolve the same address while chronological/candidate admission remains with their operation owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A valid address does not prove the shot exists or the selection was authorized/committed, and no shot-specific suffix or fixture path is introduced.
 * @evidence contracts/common.md#meaningful-documentation States relative storage scope and both identity admissions, distinguishing immutable history records from the active repaint pointer.
 * @evidence contracts/performance.md#efficient-algorithms Trims/encodes shot text, checks one fixed-format UUID and joins fixed segments; shot length drives string cost while selection history length does not.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Pure addressing has no acquired work or effect to share, and callers retain a formatted path only for their own history traversal/publication.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Transfers one string with no retained history population, handle, lease or running task.
 */
export function productionProjectRepaintSelectionPath(shot: string, selectionId: string): string {
    return path.posix.join("renditions", "selections", encodeAutoMoviePathSegment(productionProjectTrimmedText(shot, "Repaint shot")), `${encodeAutoMoviePathSegment(productionProjectUuid(selectionId, "Repaint selection id"))}.json`);
}
