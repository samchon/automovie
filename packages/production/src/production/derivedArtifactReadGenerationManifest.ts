import type { Stats } from "node:fs";
import type { IAutoMovieDerivedArtifactManifest } from "@automovie/interface";
import { derivedArtifactResolveCanonical } from "./derivedArtifactResolveCanonical";
import { AUTOMOVIE_DERIVED_ARTIFACT_MANIFEST_PATH } from "./AUTOMOVIE_DERIVED_ARTIFACT_MANIFEST_PATH";
import { derivedArtifactLstatOrNull } from "./derivedArtifactLstatOrNull";
import { derivedArtifactReadPhysicalFile } from "./derivedArtifactReadPhysicalFile";
import { derivedArtifactParseManifest } from "./derivedArtifactParseManifest";
import { AutoMovieDerivedArtifactGenerationError } from "./AutoMovieDerivedArtifactGenerationError";
import { derivedArtifactManifestInvariantFailure } from "./derivedArtifactManifestInvariantFailure";
import { derivedArtifactGenerationFailure } from "./derivedArtifactGenerationFailure";

/**
 * A missing ledger yields version 1 with no records; a present physical JSON file must pass strict shape and invariant admission.
 *
 * @evidence contracts/common.md#principled-implementation A missing ledger yields version 1 with no records; a present physical JSON file must pass strict shape and invariant admission.
 * @evidence contracts/common.md#clear-and-simple-design Generation and retirement share one fail-closed manifest reader instead of repairing malformed resident ledgers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only actual absence creates an empty ledger; unsafe files, malformed JSON and inconsistent digests throw rather than silently resetting history.
 * @evidence contracts/common.md#meaningful-documentation States empty-on-absence, version-one admission and path-unsafe versus manifest-malformed refusals.
 * @evidence contracts/performance.md#efficient-algorithms Reads B ledger bytes and validates A records/I inputs, including basis hashes and key/path ordering checks.
 * @evidence contracts/performance.md#reuse-equivalent-work The parsed admitted manifest is reused by the owning attempt; every lock-protected invocation observes resident bytes afresh.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the returned tree; synchronous file bytes and parser state expire after return or refusal.
 */
export const derivedArtifactReadGenerationManifest: (root: string) => IAutoMovieDerivedArtifactManifest = (root: string): IAutoMovieDerivedArtifactManifest => {
    const file: string = derivedArtifactResolveCanonical(root, AUTOMOVIE_DERIVED_ARTIFACT_MANIFEST_PATH);
    const linked: Stats | null = derivedArtifactLstatOrNull(file);
    if (linked === null)
        return { version: 1, artifacts: [] };
    const bytes: Uint8Array = derivedArtifactReadPhysicalFile(root, file);
    const parsed: ReturnType<typeof derivedArtifactParseManifest> = derivedArtifactParseManifest(bytes);
    if (parsed.manifest === null)
        throw new AutoMovieDerivedArtifactGenerationError("manifest-malformed", parsed.reason);
    const manifest: IAutoMovieDerivedArtifactManifest = parsed.manifest;
    const invariant: ReturnType<typeof derivedArtifactManifestInvariantFailure> = derivedArtifactManifestInvariantFailure(manifest);
    if (invariant !== null)
        derivedArtifactGenerationFailure(invariant.pathUnsafe ? "path-unsafe" : "manifest-malformed", invariant.message);
    return manifest;
};
