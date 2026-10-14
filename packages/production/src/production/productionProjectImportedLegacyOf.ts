import { readAutoMovieProductionProjectJson as readOwnedJson } from "./readAutoMovieProductionProjectJson";
import { IAutoMovieProductionManifest } from "@automovie/interface";
import path from "node:path";

/**
 * Recover the optional historical import revision from the owned legacy plan.
 *
 * @evidence contracts/common.md#principled-implementation Reads the fixed legacy plan through guarded JSON acquisition and returns importedLegacy only for an object with a safe-integer legacyRevision; other parsed shapes remain absence while acquisition/parse failures propagate.
 * @evidence contracts/common.md#clear-and-simple-design Projects one existing plan fact into the synthesized layout, without a new import ledger or a schema claiming the entire historical plan is valid.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Keeps the historical safe-integer policy without inventing a non-negative revision requirement or treating unreadable/corrupt JSON as a valid empty plan.
 * @evidence contracts/common.md#meaningful-documentation Optional import metadata uses sourceRoot dot and the admitted historical revision; this projection does not execute an import or prove its artifacts current.
 * @evidence contracts/performance.md#efficient-algorithms Includes the full guarded plan read/parse with potentially quadratic numeric suffix-copy work, followed by constant-field admission; no historical source or imported artifact payload population is scanned.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The constructor reads this one plan once for its opening manifest; no mutable plan result is reused across independent openings.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The small projection transfers into state and complete plan data is temporary without a byte cap here; guarded acquisition attempts descriptor cleanup and propagates refusal, and no import task is started.
 */
export function productionProjectImportedLegacyOf(rootReal: string, automovieRoot: string): Pick<IAutoMovieProductionManifest, "importedLegacy"> {
    const plan: unknown = readOwnedJson(rootReal, path.join(automovieRoot, "imports", "legacy-v1", "plan.json"));
    if (typeof plan !== "object" || plan === null || Array.isArray(plan))
        return {};
    const revision: unknown = (plan as {
        legacyRevision?: unknown;
    }).legacyRevision;
    if (typeof revision !== "number" || Number.isSafeInteger(revision) === false)
        return {};
    return { importedLegacy: { revision, sourceRoot: "." } };
}
