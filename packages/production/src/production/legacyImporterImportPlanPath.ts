

/**
 * Canonical relative location of the persisted v1 import plan inside the new production-state root; publication, verification and rollback read the same member.
 */
export const legacyImporterImportPlanPath: ReturnType<() => "imports/legacy-v1/plan.json"> = "imports/legacy-v1/plan.json";
