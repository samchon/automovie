import { AUTOMOVIE_AUTHORED_DOCUMENT_LAYERS } from "@automovie/evidence";

/**
 * Borrow the evidence package's fixed authored-layer array for binder admission; this is one shared schema identity, not a copied content catalogue, and the binder does not mutate it. Module retention is fixed to that array, with no descriptor or task.
 */
export const productionBinderAuthoredDocumentLayers: typeof AUTOMOVIE_AUTHORED_DOCUMENT_LAYERS = AUTOMOVIE_AUTHORED_DOCUMENT_LAYERS;
