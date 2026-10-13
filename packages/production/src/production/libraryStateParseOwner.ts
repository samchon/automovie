import type { IAutoMovieMaterializedLibraryOwner } from "@automovie/interface";
import { libraryStateIsRecord } from "./libraryStateIsRecord";
import { libraryStateIsDigest } from "./libraryStateIsDigest";
import { libraryStateIsStringArray } from "./libraryStateIsStringArray";
import { libraryStateAssertExactKeys } from "./libraryStateAssertExactKeys";
import { libraryStateUnique } from "./libraryStateUnique";

/**
 * Exact fields, string identities, digest spelling and three string arrays precede unique sorted id admission.
 *
 * @evidence contracts/common.md#principled-implementation Exact fields, string identities, digest spelling and three string arrays precede unique sorted id admission.
 * @evidence contracts/common.md#clear-and-simple-design All index owners use one structural gate before graph correspondence checks.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts String fields alone do not authenticate addresses; contexts is required here even though a wider interface permits omission.
 * @evidence contracts/common.md#meaningful-documentation States required contexts, exact keys and sharing of admitted parsed arrays.
 * @evidence contracts/performance.md#efficient-algorithms Checks fixed fields, scans A entries and sorts copied arrays for order validation, without source reads.
 * @evidence contracts/performance.md#reuse-equivalent-work Admitted arrays are reused in the new owner record.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The record shares parsed arrays; temporary sorted copies expire and no handle is acquired.
 */
export const libraryStateParseOwner: (value: unknown, index: number) => IAutoMovieMaterializedLibraryOwner = (value: unknown, index: number): IAutoMovieMaterializedLibraryOwner => {
    if (libraryStateIsRecord(value) === false ||
        typeof value.branch !== "string" ||
        typeof value.owner !== "string" ||
        typeof value.source !== "string" ||
        typeof value.export !== "string" ||
        libraryStateIsDigest(value.sourceDigest) === false ||
        libraryStateIsStringArray(value.environments) === false ||
        libraryStateIsStringArray(value.models) === false ||
        libraryStateIsStringArray(value.contexts) === false)
        throw new Error(`Library index owner ${index} is malformed.`);
    libraryStateAssertExactKeys(value, [
        "branch",
        "contexts",
        "environments",
        "export",
        "models",
        "owner",
        "source",
        "sourceDigest",
    ]);
    return {
        branch: value.branch,
        owner: value.owner,
        source: value.source,
        export: value.export,
        sourceDigest: value.sourceDigest,
        environments: libraryStateUnique(value.environments, index, "environment"),
        models: libraryStateUnique(value.models, index, "model"),
        contexts: libraryStateUnique(value.contexts, index, "context"),
    };
};
