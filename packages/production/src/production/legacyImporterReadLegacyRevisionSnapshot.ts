import path from "node:path";
import { legacyImporterReadPhysicalFile } from "./legacyImporterReadPhysicalFile";
import { legacyImporterValidateLegacyRevision } from "./legacyImporterValidateLegacyRevision";
import { legacyImporterParseJson } from "./legacyImporterParseJson";

/**
 * Read optional revision.json as both exact bytes and a validated nonnegative safe revision number. Absence represents revision zero while preserving null byte evidence.
 *
 * @evidence contracts/common.md#principled-implementation Exact bytes and decoded revision are paired so the outer capture compares both semantic value and representation at its before/after boundaries.
 * @evidence contracts/common.md#clear-and-simple-design One small reader composes physical-file admission, structured JSON parsing and revision validation without owning a lock.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Absent revision is the supported v1 initial state, while malformed or linked revision content refuses rather than defaulting to zero.
 * @evidence contracts/common.md#meaningful-documentation Documents absent zero/null semantics and the independent raw-byte witness used to catch representation changes.
 * @evidence contracts/performance.md#efficient-algorithms Reading and parsing R revision bytes uses O(R) work and buffers plus fixed scalar validation; no separate revision-byte cap is enforced.
 * @evidence contracts/performance.md#reuse-equivalent-work Uses shared physical/JSON/value validators, but boundary calls reread bytes because optimistic snapshotting requires current evidence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller retains the returned revision buffer for its current capture; native descriptors close within the owned reader and no lock or task transfers here.
 */
export const legacyImporterReadLegacyRevisionSnapshot: (root: string) => { bytes: Uint8Array | null; revision: number } = (
  root: string,
): { bytes: Uint8Array | null; revision: number } => {
  const file: string = path.join(root, "revision.json");
  const bytes: Uint8Array<ArrayBufferLike> | null = legacyImporterReadPhysicalFile(root, "revision.json", false);
  return {
    bytes,
    revision:
      bytes === null ? 0 : legacyImporterValidateLegacyRevision(legacyImporterParseJson(bytes, file), file),
  };
};
