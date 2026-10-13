import { IAutoMovieLegacyImportPlan } from "@automovie/interface";
import { assertAutoMovieLegacyImportPlan } from "./assertAutoMovieLegacyImportPlan";

/**
 * Boolean companion for paths whose established API uses a predicate.
 *
 * @evidence contracts/common.md#principled-implementation The complete assertion defines the predicate; every thrown failure produces false.
 * @evidence contracts/common.md#clear-and-simple-design Boolean consumers share asserting consumers' schema, runtime and fingerprint admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unexpected host failures also become false; diagnostic detail and live-file verification are outside this predicate.
 * @evidence contracts/common.md#meaningful-documentation States complete admission reach and the boolean API's diagnostic loss.
 * @evidence contracts/performance.md#efficient-algorithms Includes all assertion traversal, schema and canonical hashing costs.
 * @evidence contracts/performance.md#reuse-equivalent-work Delegates rather than maintaining a weaker validator or cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a boolean escapes; the plan stays caller-owned and temporary checks expire.
 */
export const isAutoMovieLegacyImportPlan: (value: unknown) => value is IAutoMovieLegacyImportPlan = (value: unknown): value is IAutoMovieLegacyImportPlan => {
    try {
        assertAutoMovieLegacyImportPlan(value);
        return true;
    }
    catch {
        return false;
    }
};
