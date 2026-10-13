import type { IAutoMovieDerivedArtifactManifest, IAutoMovieDerivedArtifactRecord } from "@automovie/interface";
import path from "node:path";
import { acquireCommitLock, releaseCommitLock } from "../project/commitLock";
import { derivedArtifactPhysicalProjectRoot } from "./derivedArtifactPhysicalProjectRoot";
import { derivedArtifactAssertGenerationPath } from "./derivedArtifactAssertGenerationPath";
import { AUTOMOVIE_DERIVED_ARTIFACT_DERIVED_ROOT } from "./AUTOMOVIE_DERIVED_ARTIFACT_DERIVED_ROOT";
import { derivedArtifactGenerationFailure } from "./derivedArtifactGenerationFailure";
import { derivedArtifactResolveCanonical } from "./derivedArtifactResolveCanonical";
import { AUTOMOVIE_DERIVED_ARTIFACT_LOCK_PATH } from "./AUTOMOVIE_DERIVED_ARTIFACT_LOCK_PATH";
import { derivedArtifactEnsurePhysicalDirectory } from "./derivedArtifactEnsurePhysicalDirectory";
import { derivedArtifactReadGenerationManifest } from "./derivedArtifactReadGenerationManifest";
import { derivedArtifactWritePhysicalFileAtomic } from "./derivedArtifactWritePhysicalFileAtomic";
import { AUTOMOVIE_DERIVED_ARTIFACT_MANIFEST_PATH } from "./AUTOMOVIE_DERIVED_ARTIFACT_MANIFEST_PATH";
import { AutoMovieDerivedArtifactGenerationError } from "./AutoMovieDerivedArtifactGenerationError";
import { derivedArtifactErrorMessage } from "./derivedArtifactErrorMessage";

/**
 * Remove one obsolete artifact from the active ledger, preserving its bytes.
 *
 * Explicit retirement uses the generation lock and atomic manifest writer. A source that still requests the retired path receives no context entry; neither its old output nor other records are rewritten to appear current. Calling this again for an absent record does not publish a new manifest.
 *
 * @evidence contracts/common.md#principled-implementation Under the generation lock, canonical output filtering removes one ledger entry while preserving its resident output bytes.
 * @evidence contracts/common.md#clear-and-simple-design Retirement changes only the active manifest; consumers requesting that old output lose its admitted context.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An already absent entry is a no-write result rather than a fabricated changed manifest; unrelated records and output bytes are untouched.
 * @evidence contracts/common.md#meaningful-documentation States changed meaning, preserved obsolete bytes and the explicit subsequent generation needed to reactivate an entry.
 * @evidence contracts/performance.md#efficient-algorithms Reads/admit the complete ledger, scans A records and serializes a changed ledger with sorting/admission costs from its readers.
 * @evidence contracts/performance.md#reuse-equivalent-work The admitted manifest is reused for filtering; current lock-protected reads replace any stale prior inspection.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Finally releases the acquired token; atomic manifest publication closes its descriptor and cleans an unpublished temporary, while old output files remain caller-managed.
 */
export const retireAutoMovieDerivedArtifact: (props: {

    /**
     * Physical project root the operation admits; path text alone is not a root identity lease.
     */
    root: string;

    /**
     * Canonical output path below the owned derived namespace.
     */
    output: string;
}) => {

    /** Whether an active ledger entry was removed and its manifest republished; output bytes remain untouched. */
    changed: boolean;

    /**
     * Parsed/admitted ledger returned by the owning operation; parsing alone does not authenticate live output bytes.
     */
    manifest: IAutoMovieDerivedArtifactManifest;
} = (props: {

    /**
     * Physical project root the operation admits; path text alone is not a root identity lease.
     */
    root: string;

    /**
     * Canonical output path below the owned derived namespace.
     */
    output: string;
}): {

    /** Whether an active ledger entry was removed and its manifest republished; output bytes remain untouched. */
    changed: boolean;

    /**
     * Parsed/admitted ledger returned by the owning operation; parsing alone does not authenticate live output bytes.
     */
    manifest: IAutoMovieDerivedArtifactManifest;
} => {
    const root: string = derivedArtifactPhysicalProjectRoot(props.root, "path-unsafe");
    derivedArtifactAssertGenerationPath(props.output, "output");
    if (!props.output.startsWith(AUTOMOVIE_DERIVED_ARTIFACT_DERIVED_ROOT))
        derivedArtifactGenerationFailure("path-unsafe", `Derived output must live below "${AUTOMOVIE_DERIVED_ARTIFACT_DERIVED_ROOT}".`);
    const lockFile: string = derivedArtifactResolveCanonical(root, AUTOMOVIE_DERIVED_ARTIFACT_LOCK_PATH);
    let token: string | null = null;
    try {
        derivedArtifactEnsurePhysicalDirectory(root, path.join(root, "automovie"));
        token = acquireCommitLock(lockFile);
        const manifest: IAutoMovieDerivedArtifactManifest = derivedArtifactReadGenerationManifest(root);
        const artifacts: IAutoMovieDerivedArtifactRecord[] = manifest.artifacts.filter((entry: IAutoMovieDerivedArtifactRecord) : boolean => entry.path !== props.output);
        if (artifacts.length === manifest.artifacts.length)
            return { changed: false, manifest };
        const next: IAutoMovieDerivedArtifactManifest = { version: 1, artifacts };
        derivedArtifactWritePhysicalFileAtomic(root, derivedArtifactResolveCanonical(root, AUTOMOVIE_DERIVED_ARTIFACT_MANIFEST_PATH), Buffer.from(`${JSON.stringify(next, null, 2)}\n`));
        return { changed: true, manifest: next };
    }
    catch (error) {
        if (error instanceof AutoMovieDerivedArtifactGenerationError)
            throw error;
        throw new AutoMovieDerivedArtifactGenerationError("publication-failed", `Derived artifact retirement failed: ${derivedArtifactErrorMessage(error)}`, { cause: error });
    }
    finally {
        if (token !== null)
            releaseCommitLock(lockFile, token);
    }
};
