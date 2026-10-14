import { readAutoMovieProductionProjectJson as readOwnedJson } from "./readAutoMovieProductionProjectJson";
import path from "node:path";

/**
 * Read an optional legacy singleton production id before namespace migration.
 *
 * @evidence contracts/common.md#principled-implementation Reads the physically guarded legacy production.json and returns null only when its id is undefined; a present id must be a trimmed nonblank string before migration can choose the singleton namespace.
 * @evidence contracts/common.md#clear-and-simple-design Extracts only historical identity; full production design schema and the migration plan stay with their respective consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not normalize a malformed id or claim this check enforces every portable production-id rule; later namespace registration/encoding owns those constraints.
 * @evidence contracts/common.md#meaningful-documentation Null distinguishes no declared legacy id from an invalid present value, and reader/JSON failures propagate before any migration side effect.
 * @evidence contracts/performance.md#efficient-algorithms Includes one guarded JSON read/parse and string trim checks, proportional to record bytes and id length; no design graph or payload population is loaded.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One constructor registration decision needs this resident optional identity; no cross-opening cache substitutes for the current legacy record.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the id string or null transfers to the caller; parsed JSON is local and guarded acquisition closes its descriptor without retaining a migration task.
 */
export function productionProjectLegacyProductionId(rootReal: string, automovieRoot: string): string | null {
    const value: unknown = readOwnedJson(rootReal, path.join(automovieRoot, "design", "production.json"));
    const id: unknown = (value as {
        id?: unknown;
    } | null | undefined)?.id;
    if (id === undefined)
        return null;
    if (typeof id !== "string" || id.trim().length === 0 || id.trim() !== id)
        throw new Error(`Legacy production design has an invalid id in "${path.join(automovieRoot, "design", "production.json")}". Correct it to one trimmed non-empty production id before migration.`);
    return id;
}
