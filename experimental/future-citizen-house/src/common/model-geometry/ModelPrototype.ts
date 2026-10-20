import type { ModelStateRecord } from "./ModelStateRecord";

/**
 * Catalog identity and ordered draft states. Catalog owners retain these mutable records for module lifetime and expose them without cloning; exact state lookup and mesh construction belong to ModelRepresentation.
 */
export interface ModelPrototype {
  /** Exact lookup token passed to material resolution, silhouette dispatch and model-ID construction. */
  anchor: string;

  /** Presentation name copied into the returned model. */
  name: string;

  /** Authored state order; duplicate tokens would select the first match during building. */
  states: ModelStateRecord[];
}
