import type { IAutoMovieMaterializedLibrary, IAutoMovieMaterializedLibraryOwner } from "@automovie/interface";
import { compareCodeUnits } from "./contentIdentity";
import { parseAutoMovieStructuredJson } from "./duplicateAwareJson";
import { libraryStateIsRecord } from "./libraryStateIsRecord";
import { libraryStateAssertExactKeys } from "./libraryStateAssertExactKeys";
import { libraryStateIsDigest } from "./libraryStateIsDigest";
import { libraryStateParseOwner } from "./libraryStateParseOwner";

/**
 * Strict JSON/exact v1 keys and admitted owner records precede duplicate tuple identity and canonical owner-order checks.
 *
 * @evidence contracts/common.md#principled-implementation Strict JSON/exact v1 keys and admitted owner records precede duplicate tuple identity and canonical owner-order checks.
 * @evidence contracts/common.md#clear-and-simple-design The state gate parses once before comparing selected compile and graph identities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Digest spelling does not prove current bytes; production/builder equality and graph correspondence are later checks.
 * @evidence contracts/common.md#meaningful-documentation States schema/order refusal and fresh index/list ownership without artifact authentication claims.
 * @evidence contracts/performance.md#efficient-algorithms Parses B bytes, validates O owners/A ids and sorts owners using tuple text; storage includes tree/lists/identity strings.
 * @evidence contracts/performance.md#reuse-equivalent-work The parsed tree feeds shape and owner admission once, without a retained index cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller receives the index/arrays and temporary parser/sort state expires.
 */
export const libraryStateParseIndex: (bytes: Uint8Array) => IAutoMovieMaterializedLibrary = (bytes: Uint8Array): IAutoMovieMaterializedLibrary => {
    const value: unknown = parseAutoMovieStructuredJson({
        record: "library/index.json",
        bytes,
    });
    if (libraryStateIsRecord(value) === false || value.version !== 1)
        throw new Error("Library index is not a supported version-1 object.");
    libraryStateAssertExactKeys(value, [
        "builder",
        "inputFingerprint",
        "owners",
        "production",
        "version",
    ]);
    if (typeof value.builder !== "string" ||
        typeof value.production !== "string" ||
        libraryStateIsDigest(value.inputFingerprint) === false ||
        Array.isArray(value.owners) === false)
        throw new Error("Library index identity or owners are malformed.");
    const owners: IAutoMovieMaterializedLibraryOwner[] = value.owners.map((owner: unknown, index: number) : IAutoMovieMaterializedLibraryOwner => libraryStateParseOwner(owner, index));
    const identities: string[] = owners.map((owner: IAutoMovieMaterializedLibraryOwner) : string => JSON.stringify([owner.branch, owner.owner, owner.source, owner.export]));
    if (new Set(identities).size !== identities.length)
        throw new Error("Library index repeats an owner identity.");
    const sortedOwners: IAutoMovieMaterializedLibraryOwner[] = [...owners].sort((left: IAutoMovieMaterializedLibraryOwner, right: IAutoMovieMaterializedLibraryOwner) : number => compareCodeUnits(JSON.stringify([left.branch, left.owner, left.source, left.export]), JSON.stringify([right.branch, right.owner, right.source, right.export])));
    if (JSON.stringify(owners) !== JSON.stringify(sortedOwners))
        throw new Error("Library index owners are not in canonical order.");
    return {
        version: 1,
        builder: value.builder,
        production: value.production,
        inputFingerprint: value.inputFingerprint,
        owners,
    };
};
