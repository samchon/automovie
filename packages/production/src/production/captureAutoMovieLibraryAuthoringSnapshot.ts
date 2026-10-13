import type { IAutoMovieProductionEvidenceSourceOwnerBinding } from "@automovie/evidence";
import type { IAutoMovieProductionEvidence } from "@automovie/evidence";
import path from "node:path";
import { canonicalAutoMovieJsonBytes, compareCodeUnits, digestAutoMovieBytes, normalizeAutoMovieSource } from "./contentIdentity";
import type { IAutoMovieLibraryAuthoringSnapshot } from "./IAutoMovieLibraryAuthoringSnapshot";
import { librarySnapshotActivePaths } from "./librarySnapshotActivePaths";
import type { IAutoMovieLibraryAuthoringSourceSnapshot } from "./IAutoMovieLibraryAuthoringSourceSnapshot";
import { AUTOMOVIE_LIBRARY_AUTHORING_SNAPSHOT_PROTOCOL } from "./AUTOMOVIE_LIBRARY_AUTHORING_SNAPSHOT_PROTOCOL";
import { librarySnapshotSortedDesignBranches } from "./librarySnapshotSortedDesignBranches";
import { librarySnapshotSortedDesignOwners } from "./librarySnapshotSortedDesignOwners";
import { librarySnapshotSortedSourceOwners } from "./librarySnapshotSortedSourceOwners";

/**
 * Acquire one complete library authoring closure from a fresh graph snapshot.
 *
 * The caller supplies source reads from the same project handle that will run the builder. Missing selected members remain in the identity as `null`, so deletion is a stale transition rather than an exception that skips the publication guard.
 *
 * Evidence whose resolved root text differs from the builder's is refused. The resident digest includes root text and declaration location, while result identity uses their portable projection. Matching path text and digests do not identify a host or pin a replaced physical root; project readers and publication fences own those physical observations.
 *
 * @evidence contracts/common.md#principled-implementation Root/kind admission precedes selected-path deduplication, normalized source digests, canonical populations and complete resident identity hashing.
 * @evidence contracts/common.md#clear-and-simple-design Compile and source-status acquisition share this resident closure; portable result identity is projected separately.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts All source read/normalization failures map to null, not only missing files; root text equality proves no physical lease and returned records are not runtime-frozen.
 * @evidence contracts/common.md#meaningful-documentation States root/location participation, missing-or-unreadable null identity and same-project callback ownership.
 * @evidence contracts/performance.md#efficient-algorithms Visits graph populations and P distinct sources/B bytes, sorts paths/owners and canonically hashes selected clones; full reads and nested encoding costs remain included.
 * @evidence contracts/performance.md#reuse-equivalent-work Each distinct source is read once per capture and its digest is shared; publication requires a fresh independently acquired closure.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns cloned configuration/manifest, copied records and declared nested arrays; extra enumerable values outside the shape remain shallow, source bytes expire and callbacks own read handles.
 */
export const captureAutoMovieLibraryAuthoringSnapshot: (props: {

    /** Builder root resolved and compared textually with the evidence root; physical admission stays with the supplied project reader. */
    root: string;

    /**
     * Acquired graph selecting library kind, source paths and owners under the same builder root.
     */
    evidence: IAutoMovieProductionEvidence;

    /**
     * The same-project source reader supplies exact selected bytes, whose strict normalization produces the captured semantic identity. Snapshot capture owns selection/hash/null-failure conversion while the callback owns physical source reading.
     *
     * Every callback or normalization throw becomes a null source digest; a same textual root does not prove descriptor-pinned acquisition.
     *
     * States selected path, exact-byte result and reader resource ownership.
     *
     * For each distinct selected source, callback byte I/O cost is included in capture; no local byte or latency cap is imposed. Capture reads each distinct path once, sharing its acquired digest; the callback must not substitute stale cached bytes without its own equivalence proof.
     *
     * The callback closes any acquired handles on success or throw; capture retains its digest rather than the returned source bytes.
     */
    readSource: (path: string) => Uint8Array;
}) => IAutoMovieLibraryAuthoringSnapshot = (props: {

    /** Builder root resolved and compared textually with the evidence root; physical admission stays with the supplied project reader. */
    root: string;

    /**
     * Acquired graph selecting library kind, source paths and owners under the same builder root.
     */
    evidence: IAutoMovieProductionEvidence;

    /**
     * The same-project source reader supplies exact selected bytes, whose strict normalization produces the captured semantic identity. Snapshot capture owns selection/hash/null-failure conversion while the callback owns physical source reading.
     *
     * Every callback or normalization throw becomes a null source digest; a same textual root does not prove descriptor-pinned acquisition.
     *
     * States selected path, exact-byte result and reader resource ownership.
     *
     * For each distinct selected source, callback byte I/O cost is included in capture; no local byte or latency cap is imposed. Capture reads each distinct path once, sharing its acquired digest; the callback must not substitute stale cached bytes without its own equivalence proof.
     *
     * The callback closes any acquired handles on success or throw; capture retains its digest rather than the returned source bytes.
     */
    readSource: (path: string) => Uint8Array;
}): IAutoMovieLibraryAuthoringSnapshot => {
    const root: string = path.resolve(props.root);
    if (path.resolve(props.evidence.root) !== root)
        throw new Error(`Library authoring evidence belongs to "${path.resolve(props.evidence.root)}", not builder root "${root}". Reopen evidence from the selected project before compiling.`);
    if (props.evidence.manifest.kind !== "library")
        throw new Error(`Library authoring snapshot requires kind "library", not "${props.evidence.manifest.kind ?? "unselected"}".`);
    const paths: Set<string> = new Set<string>();
    for (const branch of props.evidence.designBranches)
        for (const source of librarySnapshotActivePaths(branch.sourceBinding))
            paths.add(source);
    for (const owner of props.evidence.designOwners)
        for (const source of librarySnapshotActivePaths(owner.sourceBinding))
            paths.add(source);
    for (const owner of props.evidence.sourceOwners ?? [])
        if (owner.enforced)
            paths.add(owner.sourcePath);
    const sources: IAutoMovieLibraryAuthoringSourceSnapshot[] = [...paths]
        .sort(compareCodeUnits)
        .map((source: string): IAutoMovieLibraryAuthoringSourceSnapshot => {
        try {
            return {
                path: source,
                digest: digestAutoMovieBytes(normalizeAutoMovieSource(props.readSource(source))),
            };
        }
        catch {
            return { path: source, digest: null };
        }
    });
    const identity: Omit<IAutoMovieLibraryAuthoringSnapshot, "digest"> = {
        version: 1 as const,
        protocol: AUTOMOVIE_LIBRARY_AUTHORING_SNAPSHOT_PROTOCOL,
        root,
        packageName: props.evidence.packageName,
        kind: "library" as const,
        configuration: structuredClone(props.evidence.configuration),
        manifest: structuredClone(props.evidence.manifest),
        designBranches: librarySnapshotSortedDesignBranches(props.evidence.designBranches),
        designOwners: librarySnapshotSortedDesignOwners(props.evidence.designOwners),
        sourceOwners: librarySnapshotSortedSourceOwners((props.evidence.sourceOwners ?? []).filter((owner: IAutoMovieProductionEvidenceSourceOwnerBinding) : boolean => owner.enforced)),
        sources,
    };
    return {
        ...identity,
        digest: digestAutoMovieBytes(canonicalAutoMovieJsonBytes(identity)),
    };
};
