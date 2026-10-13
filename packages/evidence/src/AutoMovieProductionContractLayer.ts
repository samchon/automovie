import type { AutoMovieAuthoredDocumentLayer } from "./AutoMovieAuthoredDocumentLayer";

/**
 * Authored Markdown layer that may answer a production-local contract.
 *
 * @evidence contracts/common.md#principled-implementation Local contract hosts use the existing authored document-layer union.
 * @evidence contracts/common.md#clear-and-simple-design The semantic name identifies the layer field of local claim and admission APIs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It introduces no primitive string wrapper or broader set of eligible hosts.
 * @evidence contracts/common.md#meaningful-documentation Pass selection separately distinguishes construction from final screenplay hosts.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This declaration is erased; validateAutoMovieProductionContractHosts admits layer-confined selectors, which owns the runtime algorithm and allocation cost.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type coordinates no effects; validateAutoMovieProductionContractHosts admits layer-confined selectors, which owns any valid reuse or recomputation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The schema acquires no resources; validateAutoMovieProductionContractHosts admits layer-confined selectors, while the caller or module owns the lifetime of its values.
 */
export type AutoMovieProductionContractLayer = AutoMovieAuthoredDocumentLayer;
