import { IAutoMovieSemanticMaskReceipt } from "@automovie/interface";

/**
 * Canonical committed identity for one mask frame: shot, frame, exact portable sidecar byte identity, semantic digest and ordered runtime coverage. Reopening is required before these fields can establish current evidence.
 *
 * @evidence contracts/common.md#principled-implementation Aliases the interface receipt that creation and reopening validate against canonical palette bytes and current shot/frame expectations.
 * @evidence contracts/common.md#clear-and-simple-design One schema serves capture bundles and deliverable ledgers; byte admission and plan membership remain runtime owner decisions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The alias adds no trust to a claimed digest/path and does not substitute a text fingerprint for actual sidecar bytes.
 * @evidence contracts/common.md#meaningful-documentation Documents committed byte identity and the reopening requirement; canonical version/frame/path/coverage constraints stay with interface and receipt validators.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The erased alias performs no hash, parsing or lookup algorithm; runtime receipt creation/reopen owns those costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It stores no cache and cannot decide receipt equivalence or invalidation; resident readers check each relevant generation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no state or resource. Ledger/capture callers retain its fields and copied unresolved identifiers for their own lifetimes.
 */
export type IAutoMovieProductionSemanticMaskReceipt = IAutoMovieSemanticMaskReceipt;
