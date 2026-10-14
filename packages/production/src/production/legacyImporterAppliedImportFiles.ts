import { IAutoMovieLegacyImportPlan } from "@automovie/interface";
import { legacyImporterImportPlanPath } from "./legacyImporterImportPlanPath";
import { legacyImporterImportStatePath } from "./legacyImporterImportStatePath";
import type { legacyImporterAppliedImportState } from "./legacyImporterAppliedImportState";
import { legacyImporterProductionManifestOf } from "./legacyImporterProductionManifestOf";
import { legacyImporterSerializeJson } from "./legacyImporterSerializeJson";

/**
 * Build the exact manifest, incarnation, zero revision, plan and applied-state byte population for a new import or its rollback restoration. Revision.lock is supplied separately only by a restoration or verification owner.
 *
 * @evidence contracts/common.md#principled-implementation The fixed v2 provenance file set is serialized from the admitted plan and incarnation state, with project manifest roots and imported-legacy revision derived from those inputs.
 * @evidence contracts/common.md#clear-and-simple-design One byte composer is shared by publication, exact-state verification and restoration so those operations compare the same intended population.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No legacy file is rewritten and no arbitrary additional state file is admitted as an import member; resident revision lock bytes remain a separate ownership witness.
 * @evidence contracts/common.md#meaningful-documentation Names the five state files, their input provenance and the separate lock handling boundary.
 * @evidence contracts/performance.md#efficient-algorithms Serializes total J plan/state JSON bytes and stores five byte buffers in O(J) work/space, with no independent plan-byte cap.
 * @evidence contracts/performance.md#reuse-equivalent-work Publication, verification and restoration share this representation producer, while each call encodes its current exact plan/state rather than caching mutable input records.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned map retains encoded buffers for its caller's current publication/verification operation and acquires no descriptor or filesystem lock.
 */
export const legacyImporterAppliedImportFiles: (root: string, plan: IAutoMovieLegacyImportPlan, state: legacyImporterAppliedImportState) => ReadonlyMap<string, Uint8Array> = (
  root: string,
  plan: IAutoMovieLegacyImportPlan,
  state: legacyImporterAppliedImportState,
): ReadonlyMap<string, Uint8Array> =>
  new Map<string, Uint8Array>([
    ["manifest.json", legacyImporterSerializeJson(legacyImporterProductionManifestOf(root, plan))],
    ["incarnation.json", legacyImporterSerializeJson({ version: 1, id: state.incarnation })],
    ["revision.json", legacyImporterSerializeJson({ revision: 0 })],
    [legacyImporterImportPlanPath, legacyImporterSerializeJson(plan)],
    [legacyImporterImportStatePath, legacyImporterSerializeJson(state)],
  ]);
