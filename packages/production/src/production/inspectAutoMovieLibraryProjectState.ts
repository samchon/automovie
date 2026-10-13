import type { IAutoMovieProductionEvidence } from "@automovie/evidence";
import type { IAutoMovieGeneratedManifest, IAutoMovieMaterializedLibrary } from "@automovie/interface";
import { isAutoMovieSourceOwnerBindingComplete } from "./isAutoMovieSourceOwnerBindingComplete";
import type { IAutoMovieLibraryProjectStateInspection } from "./IAutoMovieLibraryProjectStateInspection";
import type { IAutoMovieLibraryProjectStateProblem } from "./IAutoMovieLibraryProjectStateProblem";
import { libraryStateParseIndex } from "./libraryStateParseIndex";
import { libraryStateOwnerArtifactPaths } from "./libraryStateOwnerArtifactPaths";

/**
 * Reopen a library index against its manifest and graph-selected owner closure.
 *
 * The permissive observation reader is intentionally not reused here. A current-state gate must distinguish an empty library from an unreadable or contradictory one, and must never infer production kind from residue.
 *
 * @evidence contracts/common.md#principled-implementation Declared library evidence, strict index identity, completed exact owner edges and exhaustive manifest ownership/readability decide currentness.
 * @evidence contracts/common.md#clear-and-simple-design Strict current-state admission remains separate from permissive observation of generated residue.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Timed paths are forbidden by library shape; this checker observes artifact membership/readability, leaving byte-digest and physical authentication to owning project admission.
 * @evidence contracts/common.md#meaningful-documentation States null index on any problem, stage limits, duplicate artifact ownership and readFile effects.
 * @evidence contracts/performance.md#efficient-algorithms For O owners/E edges/F files/U graph units, includes index parsing/sorting, O repeated graph owner/unit searches, artifact reads and map/set storage; callback read cost remains included.
 * @evidence contracts/performance.md#reuse-equivalent-work One source-edge map and manifest set serve this pass; prior path-only observations cannot replace fresh artifact reads.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller retains index/problems; temporary maps expire and readFile owns descriptors. No local byte/population cap is imposed.
 */
export const inspectAutoMovieLibraryProjectState: (props: {

    /**
     * Selected namespace compared with the publication index.
     */
    production: string;

    /**
     * Selected builder protocol compared with the publication index.
     */
    builder: string;

    /**
     * Current compile identity compared with the index's persisted value.
     */
    inputFingerprint: string;

    /**
     * Graph-derived library evidence; undefined or another kind refuses currentness.
     */
    authoringEvidence: IAutoMovieProductionEvidence | undefined;

    /** Generated manifest admitted by its project owner; this pass compares its library membership with the index. */
    manifest: IAutoMovieGeneratedManifest;

    /**
     * The generated-file reader returns exact current bytes or null for an unavailable selected publication member. Strict library inspection decides ownership/readability while project admission owns byte digest and physical authentication.
     *
     * This signature neither promises nonthrowing reads nor proves file contents from mere path membership; caller read errors can propagate.
     *
     * States nullable byte result and the separate physical/digest owner.
     *
     * Inspection includes every artifact read's byte and filesystem costs, with no local byte/time bound. Current member observations belong to this inspection; a path-only previous result is not an equivalent current read.
     *
     * The callback owns descriptor cleanup and returned byte ownership; inspection does not retain artifact bytes beyond readability checks.
     */
    readFile: (path: string) => Uint8Array | null;
}) => IAutoMovieLibraryProjectStateInspection = (props: {

    /**
     * Selected namespace compared with the publication index.
     */
    production: string;

    /**
     * Selected builder protocol compared with the publication index.
     */
    builder: string;

    /**
     * Current compile identity compared with the index's persisted value.
     */
    inputFingerprint: string;

    /**
     * Graph-derived library evidence; undefined or another kind refuses currentness.
     */
    authoringEvidence: IAutoMovieProductionEvidence | undefined;

    /** Generated manifest admitted by its project owner; this pass compares its library membership with the index. */
    manifest: IAutoMovieGeneratedManifest;

    /**
     * The generated-file reader returns exact current bytes or null for an unavailable selected publication member. Strict library inspection decides ownership/readability while project admission owns byte digest and physical authentication.
     *
     * This signature neither promises nonthrowing reads nor proves file contents from mere path membership; caller read errors can propagate.
     *
     * States nullable byte result and the separate physical/digest owner.
     *
     * Inspection includes every artifact read's byte and filesystem costs, with no local byte/time bound. Current member observations belong to this inspection; a path-only previous result is not an equivalent current read.
     *
     * The callback owns descriptor cleanup and returned byte ownership; inspection does not retain artifact bytes beyond readability checks.
     */
    readFile: (path: string) => Uint8Array | null;
}): IAutoMovieLibraryProjectStateInspection => {
    const problems: IAutoMovieLibraryProjectStateProblem[] = [];
    const evidence: IAutoMovieProductionEvidence | undefined = props.authoringEvidence;
    if (evidence === undefined || evidence.manifest.kind !== "library")
        return {
            index: null,
            problems: [
                {
                    code: "authoring-evidence-required",
                    path: null,
                    message: "Current library state requires graph-derived library authoring evidence; generated residue cannot select the production kind.",
                },
            ],
        };
    const manifestPaths: Set<string> = new Set(props.manifest.files.map((file: IAutoMovieGeneratedManifest["files"][number]) : string => file.path));
    const timedResidue: IAutoMovieGeneratedManifest["files"][number] | undefined = props.manifest.files.find((file: IAutoMovieGeneratedManifest["files"][number]) : boolean => file.path === "manifests/compile.json" ||
        file.path === "contracts/production.json" ||
        file.path === "contracts/world.json" ||
        file.path.startsWith("shots/") ||
        file.path.startsWith("film/"));
    if (timedResidue !== undefined)
        problems.push({
            code: "generated-shape-mismatch",
            path: timedResidue.path,
            message: `Library publication manifest contains timed-production artifact "${timedResidue.path}". Recompile one declared production shape from a clean generated transaction.`,
        });
    const indexBytes: Uint8Array | null = manifestPaths.has("library/index.json")
        ? props.readFile("library/index.json")
        : null;
    if (indexBytes === null)
        return {
            index: null,
            problems: problems.concat({
                code: "generated-file-missing",
                path: "library/index.json",
                message: "Library publication manifest does not own a readable library/index.json.",
            }),
        };
    let index: IAutoMovieMaterializedLibrary;
    try {
        index = libraryStateParseIndex(indexBytes);
    }
    catch (error) {
        return {
            index: null,
            problems: problems.concat({
                code: "library-index-invalid",
                path: "library/index.json",
                // The index parser throws nothing but its own Error refusals.
                message: (error as Error).message,
            }),
        };
    }
    if (index.production !== props.production ||
        index.builder !== props.builder ||
        index.inputFingerprint !== props.inputFingerprint)
        problems.push({
            code: "library-index-invalid",
            path: "library/index.json",
            message: "Library index production, builder, or input fingerprint differs from the selected current compile identity.",
        });
    const bindings: Map<string, IAutoMovieProductionEvidence["sourceOwners"][number]> = new Map(evidence.sourceOwners.map((binding: IAutoMovieProductionEvidence["sourceOwners"][number]) : [string, IAutoMovieProductionEvidence["sourceOwners"][number]] => [
        JSON.stringify([
            binding.branch,
            `${binding.targetPath}#${binding.targetAnchor}`,
            binding.sourcePath,
            binding.exportName,
        ]),
        binding,
    ]));
    const artifactOwners: Map<string, string> = new Map<string, string>();
    const indexedOwners: Set<string> = new Set<string>();
    const publishedOwners: Set<string> = new Set<string>();
    for (const owner of index.owners) {
        const ownerIdentity: string = `${owner.branch}:${owner.owner}`;
        if (indexedOwners.has(ownerIdentity))
            problems.push({
                code: "library-owner-mismatch",
                path: "library/index.json",
                message: `Library design owner "${ownerIdentity}" appears more than once in the materialized index. One reviewed owner must resolve to one exact source export.`,
            });
        else
            indexedOwners.add(ownerIdentity);
        const designOwner: IAutoMovieProductionEvidence["designOwners"][number] | undefined = evidence.designOwners.find((candidate: IAutoMovieProductionEvidence["designOwners"][number]) : boolean => candidate.branch === owner.branch &&
            candidate.units.some((unit: IAutoMovieProductionEvidence["designOwners"][number]["units"][number]) : boolean => `${candidate.path}#${unit.anchor}` === owner.owner));
        const sourceBranch: string | null = designOwner?.sourceBinding?.branch ??
            (owner.branch === "productionSources" ? owner.branch : null);
        publishedOwners.add(JSON.stringify([sourceBranch, owner.owner, owner.source, owner.export]));
        const binding: IAutoMovieProductionEvidence["sourceOwners"][number] | undefined = bindings.get(JSON.stringify([sourceBranch, owner.owner, owner.source, owner.export]));
        if (binding === undefined ||
            binding.sourceDigest !== owner.sourceDigest ||
            !isAutoMovieSourceOwnerBindingComplete(binding))
            problems.push({
                code: "library-owner-mismatch",
                path: "library/index.json",
                message: `Library owner "${ownerIdentity}" does not match one enforced graph-selected source export at the recorded digest.`,
            });
        for (const artifact of libraryStateOwnerArtifactPaths(owner)) {
            const previous: string | undefined = artifactOwners.get(artifact);
            if (previous !== undefined)
                problems.push({
                    code: "library-owner-mismatch",
                    path: artifact,
                    message: `Library artifact "${artifact}" is claimed by both "${previous}" and "${ownerIdentity}".`,
                });
            else
                artifactOwners.set(artifact, ownerIdentity);
            if (manifestPaths.has(artifact) === false ||
                props.readFile(artifact) === null)
                problems.push({
                    code: "generated-file-missing",
                    path: artifact,
                    message: `Library owner "${ownerIdentity}" names artifact "${artifact}" that is absent from the authenticated generated manifest or unreadable.`,
                });
        }
    }
    for (const binding of evidence.sourceOwners) {
        if (!isAutoMovieSourceOwnerBindingComplete(binding))
            continue;
        const identity: string = JSON.stringify([
            binding.branch,
            `${binding.targetPath}#${binding.targetAnchor}`,
            binding.sourcePath,
            binding.exportName,
        ]);
        if (publishedOwners.has(identity) === false)
            problems.push({
                code: "library-owner-mismatch",
                path: "library/index.json",
                message: `Completed source export "${binding.sourcePath}#${binding.exportName}" has no exact owner entry in the materialized library index.`,
            });
    }
    for (const file of props.manifest.files)
        if (file.path !== "library/index.json" &&
            artifactOwners.has(file.path) === false)
            problems.push({
                code: "generated-shape-mismatch",
                path: file.path,
                message: `Generated file "${file.path}" is not owned by the selected library index.`,
            });
    return { index: problems.length === 0 ? index : null, problems };
};
