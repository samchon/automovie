import { AutoMovieAuthoredDocumentLayer } from "./AutoMovieAuthoredDocumentLayer";

/**
 * Scripts and screenplays use the scaffold's numbered group/unit topology; all other admitted layers use flat reader collection. This fixed shared Set chooses reader topology uniformly and does not retain source documents or native resources.
 */
export const productionBinderGroupedDocumentLayers: ReadonlySet<AutoMovieAuthoredDocumentLayer> = new Set(["screenplays", "scripts"]);
