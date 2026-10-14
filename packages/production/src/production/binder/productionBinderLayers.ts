import { productionBinderAuthoredDocumentLayers } from "./productionBinderAuthoredDocumentLayers";

/**
 * Fixed authored-layer membership used by constructor runtime admission, built once from the evidence-owned layer array. The module owns this bounded Set for its lifetime; it neither caches reader output nor acquires native resources.
 */
export const productionBinderLayers: ReadonlySet<string> = new Set(productionBinderAuthoredDocumentLayers);
