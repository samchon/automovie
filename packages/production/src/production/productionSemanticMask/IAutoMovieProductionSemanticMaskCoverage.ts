import { IAutoMovieSemanticMaskCoverage } from "@automovie/interface";

/**
 * Canonical runtime coverage shape: sorted unique unresolved identifiers and a non-negative safe integer unaddressed mesh count. Incomplete coverage remains an observation and refuses final mask delivery.
 *
 * @evidence contracts/common.md#principled-implementation Aliases the interface coverage without adding a second representation; verifyCoverage checks order/non-blank identifiers/count and classifiers interpret remaining gaps.
 * @evidence contracts/common.md#clear-and-simple-design The interface owns fields and units while production owns preview versus deliverable admission policy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The alias contains no proof of a coverage claim or normalized replacement; capture owners supply actual scene observations and verifiers retain them exactly.
 * @evidence contracts/common.md#meaningful-documentation Documents unresolved-order/count meaning and the preview/final distinction; canonical field descriptions remain in the referenced interface.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The erased alias selects no algorithm; coverage validation scans identifier characters and order at its runtime verifier.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It stores no equivalent work. Currentness and receipt reuse decisions belong to runtime classifiers and readers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources It acquires no resource; producer/caller ownership determines the coverage array's lifetime and size, which this type does not cap.
 */
export type IAutoMovieProductionSemanticMaskCoverage = IAutoMovieSemanticMaskCoverage;
