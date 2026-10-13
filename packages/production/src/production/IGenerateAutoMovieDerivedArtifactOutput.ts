import type { IAutoMovieDerivedArtifactManifest, IAutoMovieDerivedArtifactRecord } from "@automovie/interface";

/**
 * Changed indicates either output or manifest replacement, while manifest and record report the resulting admitted declaration.
 *
 * @evidence contracts/common.md#principled-implementation Changed indicates either output or manifest replacement, while manifest and record report the resulting admitted declaration.
 * @evidence contracts/common.md#clear-and-simple-design The generator returns these facts after sequential atomic leaf publications.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A successful record does not turn the two writes into one pair transaction or permanently pin resident files.
 * @evidence contracts/common.md#meaningful-documentation Documents changed semantics and returned ledger/record ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased output shape selects no write strategy; generateAutoMovieDerivedArtifact owns ordered atomic leaf publication.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Changed/manifest/record fields coordinate no cache; the generator compares freshly read resident bytes before deciding which leaf to replace.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type retains no ledger; callers own the returned manifest/record and resident published files remain project-owned.
 * @author Samchon
 */
export interface IGenerateAutoMovieDerivedArtifactOutput {

    /**
     * Whether either output or manifest bytes required replacement, rather than whether the callback ran.
     */
    changed: boolean;

    /**
     * Parsed/admitted ledger returned by the owning operation; parsing alone does not authenticate live output bytes.
     */
    manifest: IAutoMovieDerivedArtifactManifest;

    /**
     * Resulting declaration for the requested output, with basis and output identities.
     */
    record: IAutoMovieDerivedArtifactRecord;
}
