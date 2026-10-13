import { IAutoMovieLegacyImportPlan } from "@automovie/interface";
import { canonicalAutoMovieJsonBytes, digestAutoMovieBytes } from "./contentIdentity";
import { AUTOMOVIE_LEGACY_IMPORT_PROTOCOL } from "./AUTOMOVIE_LEGACY_IMPORT_PROTOCOL";

/**
 * Fingerprint every semantic plan member except the fingerprint itself.
 *
 * @evidence contracts/common.md#principled-implementation Canonical v2 JSON binds the v1 import protocol and every semantic plan member except its derived fingerprint.
 * @evidence contracts/common.md#clear-and-simple-design Plan creation and admission share this content composer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Recorded inventory digests do not authenticate live files; no semantic field is omitted for a fixture.
 * @evidence contracts/common.md#meaningful-documentation States self-fingerprint exclusion and rollback/draft/diagnostic closure.
 * @evidence contracts/performance.md#efficient-algorithms Includes complete canonical traversal/key sorting and hashing C encoded bytes with proportional text/byte storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Uses shared canonical bytes and hashing; a persisted fingerprint is not reused after content edits.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the digest escapes; temporary encodings expire and no file is opened.
 */
export const fingerprintAutoMovieLegacyImportPlan: (plan: IAutoMovieLegacyImportPlan) => string = (plan: IAutoMovieLegacyImportPlan): string => digestAutoMovieBytes(canonicalAutoMovieJsonBytes({
    protocol: AUTOMOVIE_LEGACY_IMPORT_PROTOCOL,
    version: plan.version,
    legacyRevision: plan.legacyRevision,
    inventory: plan.inventory,
    rollbackBaseline: plan.rollbackBaseline,
    productionDraft: plan.productionDraft,
    shotContractDrafts: plan.shotContractDrafts,
    sourceTodos: plan.sourceTodos,
    diagnostics: plan.diagnostics,
}));
